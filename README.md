# Ultimail
The ultimate emailer module for Node.js.

## Notes

#### Email Providers
Ultimail ships with a number of providers. You will need to ensure you have the appropriate permissions/accounts setup to use them.

1. Postmark (www.postmarkapp.com)

#### Email Limits
Email limits are set by the email provider you use, this includes number of recipients, email addresses you can send from and attachment limits.

#### View Engine
At present Ultimail uses Handlebars as its view engine. There may be scope to implement other view engines at a later date. For the time being if you want to use another view engine you can use the `quickSend()` method detailed below.

## Initialise Ultimail
Create a new mailer instance with some global options.

```javascript
var Ultimail = require('ultimail');

var mailer = new Ultimail({
  provider: {
    name:   'postmark',
    apiKey: 'ABC-123-XYZ'
  },
  markdown:  false,
  styles:    true,
  variables: {
    brandName: 'Amazing Widgets Ltd',
    website:   'http://www.aw-ltd.co.uk'
  }
});
```

#### Constructor Options
- **"provider"**  - A hash containing properties required to setup the email provider OR a string of provider name.
  - **"name"**      - The name of the provider e.g. `postmark`. Required if `provider` is a hash.
- **"markdown"**  - Set `true` or a hash of options to parse markdown in the HTML body. Default `false`.
- **"styles"**    - Set `true` to parse CSS styles into the HTML body. Default `true`.
- **"variables"** - A hash of variables to use with the view engine.

#### Markdown Options
See https://www.npmjs.com/package/marked for explanations of the options that can be used to configure the markdown parser. By default the following options will be used:

```javascript
markdown: {
  gfm:         true,
  tables:      true,
  breaks:      false,
  pedantic:    false,
  sanitize:    true,
  smartLists:  true,
  smartypants: false
}
```

## Sending an Email
To send an email you use the `mailer.send()` method and specify the path to the directory where it's stored, a hash of options and a callback.

```javascript
mailer.send('/path/to/template/directory/', {
  to:   'my-user@email.com'
  from: 'hello@my-website.com',
  variables: {
    firstName: 'Bob',
    lastName:  'Smith'
  }
}, function (err, success) {

  // Do something else...

});

```

#### Send Options

- **"to"**          - A string/array of email addresses to send to.
- **"cc"**          - A string/array of email address to 'cc'.
- **"bcc"**         - A string/array of email address to 'bcc'.
- **"from"**        - An email address to send from.
- **"replyTo"**     - An email address for the recipient to reply to.
- **"subject"**     - Override the template subject with a new one.
- **"attachments"** - An array of attachment objects.
- **"variables"**   - A hash of variables to use with the view engine. Any values here will override the global `variables` option.
- **"markdown"**    - Override the global `markdown` option with `true`, `false` or a hash of markdown options.
- **"styles"**      - Override the global `styles` option.
- **"provider"**    - Override the global `provider`. See Constructor Options.

## Quick Send
Send an email without any pre-processing by using `mailer.quickSend()`.

```javascript
mailer.quickSend({
  to:       'my-user@email.com'
  from:     'hello@my-website.com',
  htmlBody: '<h1>Hello</h1>',
  textBody: 'Hello',
  subject:  'Welcome'
}, function (err, success) {

  // Do something else...

});
```

#### Quick Send Options

- **"to"**          - A string/array of email addresses to send to.
- **"cc"**          - A string/array of email address to 'cc'.
- **"bcc"**         - A string/array of email address to 'bcc'.
- **"from"**        - An email address to send from.
- **"replyTo"**     - An email address for the recipient to reply to.
- **"subject"**     - Override the template subject with a new one.
- **"attachments"** - An array of attachment objects.
- **"htmlBody"**    - The string to use as the HTML body.
- **"textBody"**    - The string to use as the plain text body.
- **"provider"**    - Override the global `provider`. See Constructor Options.

## Prepare an Email (but don't send)
You can prepare an email for sending later by using the `mailer.prepare()` method. The options are the same as `mailer.send()`, except the `provider` option can't be specified. When you're ready to send the email, simply call `mailer.send()` with the email.

**Use `mailer.sendEmail()`:**
```javascript
mailer.prepare('/path/to/template/directory/', {
  to:   'my-user@email.com'
  from: 'hello@my-website.com',
  variables: {
    firstName: 'Bob',
    lastName:  'Smith'
  }
}, function (err, email) {

  // Do something else...

  // Send the email.
  mailer.send(email, null, function (err, success) {

    // Continue...

  });

});
```

**Use `email.send()`:**
```javascript
mailer.prepare('/path/to/template/directory/', {
  to:   'my-user@email.com'
  from: 'hello@my-website.com',
  variables: {
    firstName: 'Bob',
    lastName:  'Smith'
  }
}, function (err, email) {

  // Do something else...

  // Send the email.
  email.send(null, function (err, success) {

    // Continue...

  });

});
```