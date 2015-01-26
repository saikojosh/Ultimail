/*
 * mailer.quickSend() example.
 */

var Ultimail = require('../ultimail');

// Create a new mailer.
var mailer = new Ultimail({
  provider: {
    name:   'postmark',
    apiKey: '0a1d6715-33f7-4dda-b3a2-892115138935'
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