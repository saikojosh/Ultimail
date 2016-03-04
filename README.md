# Ultimail
Ultimail sends templated emails using a given provider. Templates are written using ordinary HTML and CSS, which is combined and parsed by a view engine prior to sending. This allows an email to be written once, and then customised with if statements and variables.

## Notes

#### Working Examples
A few working examples can be found in the `/examples` directory.

#### Email Providers
Ultimail ships with support for a number of email providers. You will need to ensure you have the appropriate permissions/accounts setup to use them.

1. Postmark (www.postmarkapp.com)
2. Mandrill (www.mandrill.com)

These providers only provide basic support at present. If you need a particular provider or want to add additional functionality to an exiting provider please submit a pull request.


#### Email Limits
Email limits are set by the email provider you use, this includes number of recipients, email addresses you can send from and attachment limits.

#### View Engine
At present Ultimail uses [Handlebars](http://handlebarsjs.com/) as its view engine. There may be scope to implement other view engines at a later date. For the time being if you want to use another view engine you can use the `quickSend()` method detailed below.

## Email Templates
Ultimail uses templates for sending email. Each template typically has 4 files:

- **body.html** - The HTML body of the email. Will be processed by the view engine.
- **body.txt** - The plain text body of the email. Will be processed by the view engine.
- **styles.css** - CSS for the HTML body. You can name this anything you want, and has as many external files as you want.
- **subject.txt** - The subject. Will be processed by the view engine.

#### Directory Structure
```javascript
/emailTemplates
  /passwordReset
    /body.html
    /body.txt
    /styles.css
    /subject.txt
  /welcome
    /body.html
    /body.txt
    /styles.css
    /subject.txt
```

#### External CSS
You can include as many external CSS files in your HTML body as you want, using the standard `<link>` tag. For best results store all of your external CSS files in the template directory and avoid linking to remote CSS files.

```html
<link rel="stylesheet" type="text/css" href="styles.css">
```

For these CSS includes to work you must specify the `templateDirectory` parameter as an absolute path when using `mailer.send()` and `mailer.prepare()`.

## Initialise Ultimail
Create a new mailer instance with some global options. The mailer can then be used to send multiple different emails.

```javascript
var Ultimail = require('ultimail');

var mailer = new Ultimail({
  provider: {
    name:   'postmark',
    apiKey: 'ABC-123-XYZ'
  },
  styles:    true,
  variables: {
    brandName: 'Amazing Widgets Ltd',
    website:   'http://www.aw-ltd.co.uk'
  }
});
```

#### Constructor Parameters
```javascript
new Ultimail(options);
```

- **"options"** - A hash of options to initialise the mailer with.

#### Constructor Options
- **"provider"**  - A hash containing properties required to setup the email provider OR a string of provider name.
  - **"name"**      - The name of the provider e.g. `postmark`. Required if `provider` is a hash.
- **"styles"**    - Set `true` to inline the template's external CSS styles into the HTML body. Default `true`.
- **"variables"** - A hash of variables to use with the view engine.
- **"from"**      - Set a global 'from' address to use for this mailer (optional).
- **"replyTo"**   - Set a global 'replyTo' address to use for this mailer (optional).

## Sending an Email
To send an email you use the `mailer.send()` method and specify the path to the directory where the template is stored, a hash of options and a callback.

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

#### Send Parameters
```javascript
mailer.send(templateDirectory, options, callback);
```

- **"templateDirectory"** OR **"email"** - The path to the directory where the template files are stored (this **must** be an absolute path) OR an email object.
- **"options"** - A hash of options to send the email with.
- **"callback"** - The function to call when we're finished, with the following parameters:
  - **"err"** - Either an error object or `Null`.
  - **"success"** - Either `true` or `false`.

#### Send Options
- **"to"**          - A string/array of email addresses to send to.
- **"cc"**          - A string/array of email address to 'cc'.
- **"bcc"**         - A string/array of email address to 'bcc'.
- **"from"**        - An email address to send from.
- **"replyTo"**     - An email address for the recipient to reply to.
- **"subject"**     - Override the template subject with a new one.
- **"attachments"** - An array of attachment objects.
  - **"filename"** - The filename of the attachment.
  - **"mimeType"** - The mime type of the attachment.
  - **"data"** - The content of the file encoded as a base64 string.
- **"variables"**   - A hash of variables to use with the view engine. Individual variables can overwrite those in the global `variables` option.
- **"styles"**      - Override the global `styles` option with `true` or `false`.
- **"provider"**    - Override the global `provider`. See Constructor Options.

## Quick Send
Send an email without any pre-processing by using `mailer.quickSend()`.

```javascript
mailer.quickSend({
  to:       'my-user@email.com'
  from:     'hello@my-website.com',
  subject:  'Welcome',
  htmlBody: '<h1>Hello</h1>',
  textBody: 'Hello'
}, function (err, success) {

  // Do something else...

});
```

#### Quick Send Parameters
```javascript
mailer.quickSend(options, callback);
```

- **"options"** - A hash of options to send the email with.
- **"callback"** - The function to call when we're finished, with the following parameters:
  - **"err"** - Either an error object or `Null`.
  - **"success"** - Either `true` or `false`.

#### Quick Send Options

- **"to"**          - A string/array of email addresses to send to.
- **"cc"**          - A string/array of email address to 'cc'.
- **"bcc"**         - A string/array of email address to 'bcc'.
- **"from"**        - An email address to send from.
- **"replyTo"**     - An email address for the recipient to reply to.
- **"subject"**     - Override the template subject with a new one.
- **"attachments"** - An array of attachment objects.
  - **"filename"** - The filename of the attachment.
  - **"mimeType"** - The mime type of the attachment.
  - **"data"** - The content of the file encoded as a base64 string.
- **"htmlBody"**    - The string to use as the HTML body.
- **"textBody"**    - The string to use as the plain text body.
- **"provider"**    - Override the global `provider`. See Constructor Options.

## Prepare an Email (but don't send)
You can prepare an email for sending later by using the `mailer.prepare()` method. The options are the same as `mailer.send()`, except the `provider` option can't be specified. When you're ready to send the email, simply call `mailer.send()` with the email or `email.send()`.

#### Prepare Parameters
```javascript
mailer.prepare(templateDirectory, options, callback);
```

- **"templateDirectory"** - The path to the directory where the template files are stored (this **must** be an absolute path).
- **"options"** - A hash of options to send the email with.
- **"callback"** - The function to call when we're finished, with the following parameters:
  - **"err"** - Either an error object or `Null`.
  - **"email"** - The prepared email object.

#### Send with `mailer.sendEmail()`
You can change the provider for this one email by passing the `provider` option to `mailer.send()`. See Constructor Options for more information on the provider.
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

#### Send with `email.send()`
You can change the provider for this one email by passing the `provider` option to `email.send()`. See Constructor Options for more information on the provider.
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

**`email.send()` Parameters**
```javascript
email.send(options, callback);
email.send(callback);
```
