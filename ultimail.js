/*
 * Ultimail.
 */

var fs         = require('fs');
var pathify    = require('path').join;
var async      = require('async');
var handlebars = require('handlebars');
var extender   = require('object-extender');
var Styliner   = require('styliner');
var _          = require('underscore');

/*
 * Constructor.
 */
function Ultimail (options) {

  // Default options.
  options = extender.defaults({
    provider:  null,
    styles:    true,
    variables: null,
    from:      null,
    replyTo:   null,
    useLayout: null
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
  if (!_.isFunction(callback)) { callback = this.emptyFn; }

  options = extender.defaults({
    provider: null
  }, options);

  var provider;

  // Are we overriding the provider?
  if (options.provider) {
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
  if (!_.isFunction(callback)) { callback = this.emptyFn; }

  options = extender.defaults({
    to:          null,
    cc:          null,
    bcc:         null,
    from:        this.options.from,
    replyTo:     this.options.replyTo,
    subject:     null,
    htmlBody:    null,
    textBody:    null,
    attachments: null,
    provider:    null
  }, options);

  // Setup email.
  var email = this.createEmail(options);

  // Send the email!
  return this.send(email, options, callback);

};

/*
 * Prepares an email. Default options can be overridden.
 * callback(err, email);
 */
Ultimail.prototype.prepare = function (tpl, options, callback) {
  if (!_.isFunction(callback)) { callback = this.emptyFn; }

  options = extender.defaults({
    to:          null,
    cc:          null,
    bcc:         null,
    from:        this.options.from,
    replyTo:     this.options.replyTo,
    subject:     null,
    attachments: null,
    variables:   null,
    styles:      null
  }, options);

  var instance    = this;
  var tplSubject  = pathify(tpl, 'subject.txt');
  var tplHtmlBody = pathify(tpl, 'body.html');
  var tplTextBody = pathify(tpl, 'body.txt');
  var variables   = extender.extend({}, this.options.variables, options.variables);
  var styles      = (options.styles !== null ? options.styles : this.options.styles);

  // Setup email.
  var email = this.createEmail(options);

  // Add some additional variables to use when parsing templates.
  variables.email = {
    to:      email.to,
    cc:      email.cc,
    bcc:     email.bcc,
    from:    email.from,
    replyTo: email.replyTo,
    subject: ''  //update the subject after parsing it.
  };

  // Start preparing the email.
  async.waterfall([

    // Load the subject and process the template.
    function prepareSubject (next) {

      // Don't bother loading the template if we are overriding the subject.
      if (options.subject) {
        email.subject           = options.subject;
        variables.email.subject = options.subject;
        return next(null);
      }

      instance.prepareTemplate(null, 'subject', tplSubject, variables, function (err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.subject           = output;
        variables.email.subject = output;
        return next(null);

      });

    },

    // Compile the parent template if we have one.
    function loadLayout (next) {

      // Not using a parent template.
      if (!instance.options.useLayout) { return next(null, null); }

      var layout = {
        dir:         instance.options.useLayout,
        htmlBodyTpl: null,
        textBodyTpl: null
      };
      var htmlBodyFile = pathify(layout.dir, 'body.html');
      var textBodyFile = pathify(layout.dir, 'body.txt');

      // Load in the HTML template.
      fs.readFile(htmlBodyFile, function (err, data) {

        // Ignore 'file doesn't exist' errors.
        if (err && err.code !== 'ENOENT') { return next(err); }

        // Compile the template.
        try {
          layout.htmlBodyTpl = (data ? handlebars.compile(data.toString()) : null);
        }
        catch (err) {
          return next(err);
        }

        // Load in the text template.
        fs.readFile(textBodyFile, function (err, data) {

          // Ignore 'file doesn't exist' errors.
          if (err && err.code !== 'ENOENT') { return next(err); }

          // Compile the template.
          try {
            layout.textBodyTpl = (data ? handlebars.compile(data.toString()) : null);
          }
          catch (err) {
            return next(err);
          }

          // Continue.
          return next(null, layout);

        });

      });

    },

    // Load the HTML body and process the template.
    function prepareHtmlBody (layout, next) {

      instance.prepareTemplate(layout, 'html', tplHtmlBody, variables, function (err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.htmlBody = output;
        return next(null, layout);

      });

    },

    // Load the text body and process the template.
    function prepareTextBody (layout, next) {

      instance.prepareTemplate(layout, 'text', tplTextBody, variables, function (err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.textBody = output;
        return next(null, layout);

      });

    },

    // Process styles on the HTML body.
    function inlineHTMLStyles (layout, next) {

      // Skip if no HTML body.
      if (!email.htmlBody) { return next(null); }

      // Styles have been disabled.
      if (!styles) { return next(null); }

      var stylinerOptions = {
        compact: true,
        fixYahooMQ: true,
        keepInvalid: true,
      };

      // Inline the styles in stages.
      async.waterfall([

        function layoutStyles (nextStyle) {

          var styliner = new Styliner(layout.dir, stylinerOptions);

          // Inline the CSS styles.
          styliner.processHTML(email.htmlBody)
          .then(function(source) {

            // Save and continue.
            email.htmlBody = source;
            return nextStyle(null);

          })
          .catch(function (err) {
            return nextStyle(err);
          });

        },

        function templateStyles (nextStyle) {

          var styliner = new Styliner(tpl, stylinerOptions);

          // Inline the CSS styles.
          styliner.processHTML(email.htmlBody)
          .then(function(source) {

            // Save and continue.
            email.htmlBody = source;
            return nextStyle(null);

          })
          .catch(function (err) {
            return nextStyle(err);
          });

        }

      ], function (err) {
        if (err) { return next(err); }
        return next(err, email);
      });

    }

  ], function (err) {
    if (err) { return callback(err); }
    return callback(err, email);
  });

};

/*
 * Returns a new email object.
 */
Ultimail.prototype.createEmail = function (options) {

  // Default to Null if no values are set.
  var to              = options.to       || null;
  var cc              = options.cc       || null;
  var bcc             = options.bcc      || null;
  var subject         = options.subject  || '';
  var htmlBody        = options.htmlBody || '';
  var textBody        = options.textBody || '';
  var trailingLinesRE = /(?:\r\n?|\n?)+$/;

  // Typecast values to arrays.
  if (to  !== null) { to  = (_.isArray(to)  ? to  : [to]);  }
  if (cc  !== null) { cc  = (_.isArray(cc)  ? cc  : [cc]);  }
  if (bcc !== null) { bcc = (_.isArray(bcc) ? bcc : [bcc]); }

  // Create the email.
  var email = {
    to:          to,
    cc:          cc,
    bcc:         bcc,
    from:        options.from                          || null,
    replyTo:     options.replyTo                       || null,
    subject:     subject.replace(trailingLinesRE, '')  || null,
    htmlBody:    htmlBody.replace(trailingLinesRE, '') || null,
    textBody:    textBody.replace(trailingLinesRE, '') || null,
    attachments: options.attachments                   || []
  };

  var instance = this;

  /*
   * A method for sending emails later.
   * callback(err, success);
   * [Usage]
   *  [1] email.send(options, callback);
   *  [2] email.send(callback);
   */
  email.send = function (p1, p2) {

    var options, callback;

    // [1] email.send(options, callback);
    if (_.isFunction(p2)) {
      options  = p1;
      callback = p2;
    }
    // [2] email.send(callback);
    else {
      options  = null;
      callback = p1;
    }

    // Ensure callback is defined.
    if (!_.isFunction(callback)) { callback = this.emptyFn; }

    // Send the email.
    instance.send(email, options, callback);

  };

  return email;

};

/*
 * Load and parse the template.
 * callback(err, output);
 */
Ultimail.prototype.prepareTemplate = function (layout, tplType, tplName, variables, callback) {

  // Load the template.
  fs.readFile(tplName, function (err, data) {

    // No template.
    if (err || !data) { return callback(null); }

    // Compile the handlebars template.
    try {
      var emailTpl    = handlebars.compile(data.toString());
      var emailOutput = emailTpl(variables);
    }
    catch (err) {
      return callback(err);
    }

    var finalOutput;

    // Do we have a parent layout to use?
    if (tplType === 'html' && layout.htmlBodyTpl) {
      finalOutput = layout.htmlBodyTpl({ template: emailOutput });
    }
    else if (tplType === 'text' && layout.textBodyTpl) {
      finalOutput = layout.textBodyTpl({ template: emailOutput });
    }
    else {
      finalOutput = emailOutput;
    }

    // Success!
    return callback(null, finalOutput);

  });

};

/*
 * Returns the given provider.
 */
Ultimail.prototype.loadProvider = function (options) {

  var name     = (_.isObject(options) ? options.name : options);
  var Provider = (name ? require('./providers/' + name + '.js') : null);

  // Setup the provider.
  if (Provider) { return new Provider(options); }

  return null;

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
  if (_.isUndefined(input.subject))     { return false; }
  if (_.isUndefined(input.htmlBody))    { return false; }
  if (_.isUndefined(input.textBody))    { return false; }
  if (_.isUndefined(input.attachments)) { return false; }

  // Success! The input is an email.
  return true;

};

/*
 * An empty function for to use if callbacks aren't specified.
 */
Ultimail.prototype.emptyFn = function () {};

/*
 * Export the constructor.
 */
module.exports = Ultimail;
