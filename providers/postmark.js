/*
 * Postmark provider.
 */

var Postmark = require('postmark');
var extender = require('object-extender');
var _        = require('underscore');

/*
 * Constructor.
 */
function PostmarkProvider (options) {

  options = extender.defaults({
    apiKey: null
  }, options);

  // Initialise the provider with the key.
  this.provider = new Postmark(options.apiKey);

};

/*
 * Sends the email via the provider.
 * callback(err, success);
 */
PostmarkProvider.prototype.send = function (email, callback) {

  var that = this;

  // First convert the attachments to the correct format.
  this.prepareAttachments(email.attachments, function (err, attachments) {

    if (err) { return callback(err); }

    // Send the email.
    that.provider.send({
      "To":          (email.to  ? email.to.join(',')  : null),
      "Cc":          (email.cc  ? email.cc.join(',')  : null),
      "Bcc":         (email.bcc ? email.bcc.join(',') : null),
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

  // Convert attachments array to provider format.
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