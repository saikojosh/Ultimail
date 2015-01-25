/*
 * Postmark provider.
 */

var ME           = module.exports;
var Postmark     = require('postmark');
var objectAssign = require('object-assign');
var _            = require('underscore');

/*
 * Constructor.
 */
function PostmarkProvider (options) {

  options = objectAssign({
    apiKey: null
  }, options);

  // Initialise Postmark with the key.
  this.postmark = new Postmark(options.apiKey);

};

/*
 * Sends the email via the provider.
 * callback(err, success);
 */
PostmarkProvider.prototype.send = function (email, callback) {

  var postmark = this.postmark;

  // First convert the attachments to the correct format.
  this.prepareAttachments(email.attachments, function (err, attachments) {

    if (err) { return callback(err); }

    // Send the email.
    postmark.send({
      "To":          email.to.join(','),
      "Cc":          email.cc.join(','),
      "Bcc":         email.bcc.join(','),
      "From":        email.from,
      "ReplyTo":     email.replyTo,
      "Subject":     email.subject,
      "HtmlBody":    email.htmlBody,
      "TextBody":    email.textBody,
      "Attachments": attachments
    }, function (err, success) {
      if (err) { return callback(err); }
      return callback(null, success);
    });

  });

};

/*
 * Prepare attachments in the format required by the provider.
 * callback(err, attachments);
 */
PostmarkProvider.prototype.prepareAttachments = function (input, callback) {

  var attachments = [];

  // No attachments to attach.
  if (!input || !_.isArray(input) || input.length === 0) {
    return callback(null, attachments);
  }

  // Convert attachments array to Postmark format.
  for (var i = 0, ilen = input.length ; i < ilen ; i++) {
    attachments.push({
      "Name":        input[i].filename,
      "ContentType": input[i].mimeType,
      "Content":     input[i].data
    });
  }

  return callback(null, attachments);

};

/*
 * Export the constructor.
 */
module.exports = PostmarkProvider;