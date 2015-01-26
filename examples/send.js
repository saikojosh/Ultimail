/*
 * mailer.send() example.
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

// Prepare and send an email immediately.
mailer.send(__dirname + '/emailTemplates/welcome', {
  to:   'user-email@aw-ltd.co.uk',
  from: 'webmaster@aw-ltd.co.uk',
  variables: {
    firstName: 'Josh',
    lastName:  'Cole'
  }
}, function (err, success) {

  console.log('err', err);
  console.log('success', success);

});