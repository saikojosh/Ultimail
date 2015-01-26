/*
 * mailer.quickSend() example.
 */

var Ultimail = require('../ultimail');

// Create a new mailer.
var mailer = new Ultimail({
  provider: {
    name:   'postmark',
    apiKey: 'MY-API-KEY'
  },
  variables: {
    brandName: 'Amazing Widgets Ltd',
    website:   'http://www.aw-ltd.co.uk'
  }
});

// Send an email immediately without any pre-processing.
mailer.quickSend({
  to:       'user-email@aw-ltd.co.uk',
  from:     'webmaster@aw-ltd.co.uk',
  subject:  'My Subject: {{firstName}}',
  htmlBody: '<h1>Hello,  {{firstName}}!</h1>'
}, function (err, success) {

  console.log('err', err);
  console.log('success', success);

});