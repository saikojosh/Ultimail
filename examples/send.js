/*
 * mailer.send() example.
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