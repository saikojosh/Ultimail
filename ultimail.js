/*
 * Ultimail.
 */

var fs           = require('fs');
var async        = require('async');
var juice2       = require('juice2');
var marked       = require('marked');
var objectAssign = require('object-assign');
var _            = require('underscore');

/*
 * Constructor.
 */
function Ultimail (options) {

  // Default options.
  options = objectAssign({
    provider:   'postmark',
    viewEngine: 'handlebars',
    markdown:   false
  }, options);

  // Save the options.
  this.options = options;

  // Load the default provider and view engine.
  this.provider   = this.loadProvider(options.provider);
  this.viewEngine = this.loadViewEngine(options.viewEngine);

};

/*
 * Sends an email. Default options can be overridden.
 * callback(err, success);
 */
Ultimail.prototype.send = function (tpl, options, callback) {

  var that = this;

  // First prepare the email.
  this.prepare(tpl, options, function (err, email) {

    if (err) { return callback(err); }

    // Send the email via the provider.
    that.provider.send(email, function (err, success) {
      if (err) { return callback(err); }
      return callback(null, success);
    });

  });

};

/*
 * Prepares an email. Default options can be overridden.
 * callback(err, email);
 */
Ultimail.prototype.prepare = function (tpl, options, callback) {

  options = objectAssign({
    to:          null,
    from:        null,
    replyTo:     null,
    subject:     null,
    variables:   null,
    attachments: null,
    provider:    null,
    viewEngine:  null,
    markdown:    null
  }, options);

  var that        = this;
  var tplHtmlBody = tpl + '/body.html';
  var tplTextBody = tpl + '/body.txt';
  var tplSubject  = tpl + '/subject.txt';
  var email = {
    subject:     '',
    htmlBody:    '',
    textBody:    '',
    attachments: []
  };

  // Are we overriding these options or using the defaults?
  var provider    = (options.provider   !== null ? this.loadProvider(options.provider)     : this.provider);
  var viewEngine  = (options.viewEngine !== null ? this.loadViewEngine(options.viewEngine) : this.viewEngine);
  var markdown    = (options.markdown   !== null ? options.markdown                        : this.markdown);

  // Ensure correct data types.
  if (!_.isArray(options.to)) { options.to = [options.to]; }

  // Prepare the email in stages.
  async.waterfall([

    // Load the HTML body template.
    function loadHtmlBody (next) {

      juice2(tplHtmlBody, function(err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.bodyHtml = output;
        return next(null);

      });

    },

    // Load the text body template.
    function loadTextBody (next) {

      fs.readFile(tplTextBody, function (err, data) {

        if (err) { return next(err); }

        // Save and continue.
        email.textBody = data;
        return next(null);

      });

    },

    // Load the subject template.
    function loadSubject (next) {

      // If we're overriding the subject don't bother loading the template file.
      if (options.subject) {
        email.subject = options.subject;
        return next(null);
      }

      // Load the subject template.
      fs.readFile(tplSubject, function (err, data) {

        if (err) { return next(err); }

        // Save and continue.
        email.subject = data;
        return next(null);

      });

    },

    // Process the HTML body template.
    function processHtmlBody (next) {

      // Parse the view engine.
      that.viewEngine.process(email.htmlBody, function (err, output) {

        if (err) { return next(err); }

        // Save and continue.
        email.htmlBody = output;
        return next(null);

      });

    },

    // Process markdown.
    function processMarkdown (next) {

      // Setup markdown parser if options have been given.
      if (_.isObject(that.markdown)) { marked.setOptions(that.markdown); }

      // Parse markdown.
      marked(input, function (err, output) {
        if (err) { return next(err); }
        return next(null);
      });

    },

    function (next) {



    },

    function (next) {

    }

  ], function (err) {
    if (err) { return callback(err); }
    return callback(null, email);
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
Ultimail.prototype.loadViewEngine = function (options) {

  var name       = (_.isObject(options) ? options.name : options);
  var viewEngine = (name ? require('viewEngines/' + name + '.js') : null);

  // Setup the view engine.
  if (viewEngine) { viewEngine.init(options); }

  return viewEngine;

};

/*
 * Export the constructor.
 */
module.exports = Ultimail;