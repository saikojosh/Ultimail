/*
 * Mandrill provider.
 */

var mandrill = require('mandrill-api/mandrill');
var extender = require('object-extender');
var _        = require('underscore');

/*
 * Constructor.
 */
function MandrillProvider (options) {

  options = extender.defaults({
    apiKey: null
  }, options);

  // Initialise the provider with the key.
  this.provider = new mandrill.Mandrill(options.apiKey);

};

/*
 * Sends the email via the provider.
 * callback(err, success);
 */
MandrillProvider.prototype.send = function (email, callback) {

  var that = this;

  // First convert the attachments to the correct format.
  this.prepareAttachments(email.attachments, function (err, attachments) {

    if (err) { return callback(err); }

    var to = [];

    // Setup who we're sending to.
    if (email.to) {
      for (var t = 0, tlen = email.to.length ; t < tlen ; t++) {
        to.push({
          "email": email.to[t],
          "type":  "to"
        });
      }
    }

    if (email.cc) {
      for (var c = 0, clen = email.cc.length ; c < clen ; c++) {
        to.push({
          "email": email.cc[c],
          "type":  "cc"
        });
      }
    }

    if (email.bcc) {
      for (var b = 0, blen = email.bcc.length ; b < blen ; b++) {
        to.push({
          "email": email.bcc[c],
          "type":  "bcc"
        });
      }
    }

    // Send the email.
    that.provider.send({
      "message": {
        "html":       email.htmlBody,
        "text":       email.textBody,
        "subject":    email.subject,
        "from_email": email.from,
        "to":         to,
        "inline_css": false,  //we already do this in Ultimail, no need to duplicate work.
        "headers": {
          "Reply-To": email.replyTo
        },
        "attachments": attachments
      },
      "async": true
    }, function success (result) {  //naughty - Mandrill doesn't implement the correct callback signature.
      return callback(null, true);
    }, function failure (err) {
      return callback(err);
    });

  });

};

/*
 * Prepare attachments in the format required by the provider.
 * callback(err, attachments);
 */
MandrillProvider.prototype.prepareAttachments = function (input, callback) {

  var attachments = [];

  // No attachments to attach.
  if (!input || !_.isArray(input) || input.length === 0) {
    return callback(null, attachments);
  }

  // Convert attachments array to provider format.
  for (var i = 0, ilen = input.length ; i < ilen ; i++) {
    attachments.push({
      "name":    input[i].filename,
      "type":    input[i].mimeType,
      "content": input[i].data
    });
  }

  return callback(null, attachments);

};

/*
 * Export the constructor.
 */
module.exports = MandrillProvider;