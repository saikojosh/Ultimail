/*
 * Ultimail.
 */

var fs           = require('fs');
var async        = require('async');
var juice2       = require('juice2');
var handlebars   = require('handlebars');
var marked       = require('marked');
var objectAssign = require('object-assign');
var _            = require('underscore');

/*
 * Constructor.
 */
function Ultimail (options) {

  // Default options.
  options = objectAssign({
    provider:  null,
    markdown:  false,
    styles:    true,
    variables: null
  }, options);

  // Save the options.
  this.options = options;

  // Load the default provider and view engine.
  this.provider = this.loadProvider(options.provider);

};

/*
 * Sends an email. Default options can be overridden.
 * callback(err, success);
 * [Usage]
 *  [1] send(tpl, options, callback);
 *  [2] send(email, options, callback);
 */
Ultimail.prototype.send = function (input, options, callback) {

  options = objectAssign({
    provider: null
  }, options);

  var provider;

  // Are we overriding the provider?
  if (options.provider && options.provider.name !== this.provider.name) {
    provider = this.loadProvider(options.provider);
  } else {
    provider = this.provider;
  }

  // An email has been passed in.
  if (this.isEmail(input)) { return provider.send(input, callback); }

  // Otherwise prepare the email first.
  this.prepare(input, options, function (err, email) {

    if (err) { return callback(err); }

    // Send the email via the provider.
    return provider.send(email, callback);

  });

};

/*
 * Sends a pre-prepared email using the provider. Doesn't do any pre-processing
 * on the email.
 */
Ultimail.prototype.quickSend = function (options, callback) {

  options = objectAssign({
    to:          null,
    cc:          null,
    bcc:         null,
    from:        null,
    replyTo:     null,
    subject:     null,
    htmlBody:    null,
    textBody:    null,
    attachments: null,
    provider:    null
  }, options);

  // Setup email.
  var email = new this.Email(options);

  // Send the email!
  return this.send(email, options, callback);

};

/*
 * Prepares an email. Default options can be overridden.
 * callback(err, email);
 */
Ultimail.prototype.prepare = function (tpl, options, callback) {

  options = objectAssign({
    to:          null,
    cc:          null,
    bcc:         null,
    from:        null,
    replyTo:     null,
    subject:     null,
    attachments: null,
    variables:   null,
    markdown:    null,
    styles:      null
  }, options);

  var tplHtmlBody = tpl + '/body.html';
  var tplTextBody = tpl + '/body.txt';
  var tplSubject  = tpl + '/subject.txt';
  var markdown    = objectAssign({}, this.markdown, options.markdown);
  var styles      = (options.styles !== null ? options.styles : this.styles);

  // Setup email.
  var email = new this.Email(options);

  // Start preparing the email.
  async.waterfall([

    // Load the HTML body and process the template.
    function prepareHtmlBody (next) {

      ME.prepareTemplate(tplHtmlBody, options.variables, function (err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.htmlBody = output;
        return next(null);

      });

    },

    // Load the text body and process the template.
    function prepareTextBody (next) {

      ME.prepareTemplate(tplTextBody, options.variables, function (err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.textBody = output;
        return next(null);

      });

    },

    // Load the subject and process the template.
    function prepareSubject (next) {

      // Don't bother loading the template if we are overriding the subject.
      if (options.subject) {
        email.subject = options.subject;
        return next(null);
      }

      ME.prepareTemplate(tplSubject, options.variables, function (err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.subject = output;
        return next(null);

      });

    },

    // Process markdown on the HTML body.
    function markdownHtmlBody (next) {

      // Skip if no HTML body.
      if (!email.htmlBody) { return next(null); }

      // Skip if we aren't processing markdown.
      if (!markdown) { return next(null); }

      // Default options (as per "marked" module).
      var defaultOptions = {
        gfm:         true,
        tables:      true,
        breaks:      false,
        pedantic:    false,
        sanitize:    true,
        smartLists:  true,
        smartypants: false
      };

      // Merge default options with global and instance options.
      var finalOptions = objectAssign({}, defaultOptions, markdown);

      // Set markdown options.
      marked.setOptions(finalOptions);

      // Parse markdown.
      marked(email.htmlBody, function (err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.htmlBody = output;
        return next(null);

      });

    },

    // Process styles on the HTML body.
    function juiceHtmlBody (next) {

      // Skip if no HTML body.
      if (!email.htmlBody) { return next(null); }

      // Styles have been disabled.
      if (!styles) { return next(null); }

      // Inline the CSS styles.
      juice2.juiceContent(email.bodyHtml, {
        url: 'file://' + tpl
      }, function(err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.bodyHtml = output;
        return next(null);

      });

    }

  ], function (err) {
    if (err) { return callback(err); }
    return callback(err, email);
  });

};

/*
 * Returns a new email object.
 * [Usage]
 *  new this.Email({ ... });
 */
Ultimail.prototype.Email = function (options) {

  // Default to Null if no values are set.
  var to  = options.to  || null;
  var cc  = options.cc  || null;
  var bcc = options.bcc || null;

  // Typecast values to arrays.
  if (to  !== null) { to  = (_.isArray(to)  ? to  : [to]);  }
  if (cc  !== null) { cc  = (_.isArray(cc)  ? cc  : [cc]);  }
  if (bcc !== null) { bcc = (_.isArray(bcc) ? bcc : [bcc]); }

  // Create the email.
  var email = {
    to:          to,
    cc:          cc,
    bcc:         bcc,
    from:        options.from || null,
    replyTo:     options.replyTo || null,
    htmlBody:    '',
    textBody:    '',
    subject:     '',
    attachments: options.attachments || []
  };

  // Add a method for sending email later.
  // callback(err, success);
  var instance = this;
  email.send = function (options, callback) {
    instance.send(email, options, callback);
  };

  return email;

};

/*
 * Load and parse the template.
 * callback(err, output);
 */
Ultimail.prototype.prepareTemplate = function (tplName, variables, callback) {

  // Load the template.
  fs.readFile(tplName, function (err, data) {

    // No template.
    if (err || !data) { return callback(null); }

    // Compile the handlebars template.
    try {
      var hbTpl  = handlebars.compile(data);
      var output = hbTpl(variables);
    }
    catch (err) {
      return callback(err);
    }

    // Success!
    return callback(null, output);

  });

};

/*
 * Returns the given provider.
 */
Ultimail.prototype.loadProvider = function (options) {

  var name     = (_.isObject(options) ? options.name : options);
  var provider = (name ? require('providers/' + name + '.js') : null);

  // Setup the provider.
  if (provider) { provider.init(options); }

  return provider;

};

/*
 * Returns the given view engine.
 */
Ultimail.prototype.isEmail = function (input) {

  // Must be a hash.
  if (!_.isObject(input))               { return false; }

  // Check properties.
  if (_.isUndefined(input.to))          { return false; }
  if (_.isUndefined(input.cc))          { return false; }
  if (_.isUndefined(input.bcc))         { return false; }
  if (_.isUndefined(input.from))        { return false; }
  if (_.isUndefined(input.replyTo))     { return false; }
  if (_.isUndefined(input.htmlBody))    { return false; }
  if (_.isUndefined(input.textBody))    { return false; }
  if (_.isUndefined(input.subject))     { return false; }
  if (_.isUndefined(input.attachments)) { return false; }

  // Success! The input is an email.
  return true;

};

/*
 * Export the constructor.
 */
module.exports = Ultimail;