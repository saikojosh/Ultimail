/*
 * mailer.prepare() example.
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

// Prepare an email for sending later.
mailer.prepare(__dirname + '/emailTemplates/welcome', {
  to:   'user-email@aw-ltd.co.uk',
  from: 'webmaster@aw-ltd.co.uk',
  variables: {
    firstName: 'Josh',
    lastName:  'Cole'
  }
}, function (err, email) {

  console.log('err', err);
  console.log('email', email);

  // Later we send the email...
  /*
  email.send(function (err, success) {

    console.log('err', err);
    console.log('success', success);

  });
  */

});