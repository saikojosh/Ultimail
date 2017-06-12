# Ultimail
The ultimate emailer module for Node.js: Ultimail compiles HTML and CSS templates and sends them using the email provider you configure. By default, Ultimail uses the [Handlebars](https://www.npmjs.com/package/handlebars) module for compiling HTML templates and the [Inline CSS](https://www.npmjs.com/package/inline-css) module for parsing CSS.

## Quick Start
The following example code will send an email via [Postmark](https://postmarkapp.com) using the [Ultimail-Provider-Postmark](https://www.npmjs.com/package/ultimail-provider-postmark) module. Before you can run the example you'll first need to setup an email template, or you can just run the example included in the examples directory: `node ./examples/send.js`.

```javascript
const path = require(`path`);
const Ultimail = require(`ultimail`);
const ultimailProviderPostmark = require(`ultimail-provider-postmark`);

// Create a new mailer.
const mailer = new Ultimail({
	from: `webmaster@aw-ltd.co.uk`,
	styles: true,
	variables: {
		brandName: `Amazing Widgets Ltd`,
		website: `http://www.aw-ltd.co.uk`,
	},
});

// Setup Postmark.
mailer.configure(`provider`, ultimailProviderPostmark({
	apiKey: `{{YOUR_API_KEY}}`,
}));

// Prepare some variables.
const templateDir = path.join(__dirname, `/emailTemplates/welcome`);
const options = {
	to: `user-email@aw-ltd.co.uk`,
	variables: {
		firstName: `Josh`,
		lastName: `Cole`,
	},
};

// Prepare the email and immediately send it.
mailer.send(templateDir, options)
	.then(result => console.log(`result`, result))
	.catch(err => console.error(err));
```

### Working Examples
A few working examples can be found in the `/examples` directory.

### Promises and Callbacks
Every method returns a promise unless you pass in a callback as the final parameter (see the API Overview section bellow). All callbacks have the signature `callback(err, returnValue) { ... }`.

## Setting Up Email Templates
Ultimail uses templates for sending email. Each template typically has 4 files:

- **body.html** - The HTML body of the email. Will be processed by the templating handler.
- **body.txt** - The plain text body of the email. Will be processed by the templating handler.
- **styles.css** - CSS for the HTML body.
- **subject.txt** - The subject. Will be processed by the templating handler.

### Suggested Directory Structure
Each email template should be contained within its own directory and have either a `body.html` or `body.txt` file as a minimum. Layout templates are defined in exactly the same way as email templates.

```javascript
/emailTemplates
  /layout
    /body.html
    /body.txt
    /styles.css
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

### Layout (Parent) Templates
Ultimail supports layout/parent templates which can be shared between all templates used with a given mailer instance. Each mailer can only have one layout template, but this can be overridden when preparing or sending an email.

These are great if you have a standard header/footer/design for your HTML or text emails and you want to share that between several different email templates.

Assuming you are using Handlebars (the default) as your templating handler, you will need to place the `{{{template}}}` variable to designate where the email template should be included in the layout.

If the layout and email templates both contain a `subject.txt` file, the one in the email template will be used.

## Attachments
You can add multiple attachments to an email by specifying attachment objects that include the following properties:

* **filename** - The name of the file.
* **mimeType** - The Internet mime type of the file.
* **buf** - A buffer containing the raw data of the file.

There are three ways to add attachments to emails:

```javascript
// Add default attachments to every email sent by a mailer.
const mailer = new Ultimail({
	attachments: [{
		filename: `Some photo.jpg`,
		mimeType: `image/jpeg`,
		buf: <buffer>,
	}, {
		...
	}],
});

// Add attachments when preparing or sending an email.
const email = mailer.prepare(template, {
	attachments: [{
		filename: `Some photo.jpg`,
		mimeType: `image/jpeg`,
		buf: <buffer>,
	}, {
		...
	}],
});

// Add attachments to a pre-prepared email.
email.attachments(
	[{
		filename: `Some photo.jpg`,
		mimeType: `image/jpeg`,
		buf: <buffer>,
	}, {
		...
	}]
);
```

## Additional Middleware
You can also add extra middleware functions which are run once the templates and styles have been processed (both when preparing and sending emails). It's a better practice to pass any errors to the `next()` callback, but any thrown errors will also be caught by Ultimail.

Middleware can be used to perform validation on the prepared email, modify the email, logging, or anything else you can think of.

```javascript
mailer.use((email, options, next) => {
	console.log(`Middleware email:`, email);
	if (!email.get(`plainBody`)) { return next(new Error(`A text/plain body is required`)); }
	return next(null);
});
```

## Email Object
You can modify email objects that get returned by the `mailer.prepare()` method or those which are passed to middleware or handlers. It's good practice to use the setter methods listed below rather than modifying the properties directly:

* `email.to(stringOrArray)` - An array of or comma-delimited string of email addresses.
* `email.cc(stringOrArray)` - An array of or comma-delimited string of email addresses.
* `email.bcc(stringOrArray)` - An array of or comma-delimited string of email addresses.
* `email.from(string)` - A single email address to set the "from" field.
* `email.replyTo(string)` - A single email address to set the "reply-to" field.
* `email.subject(string)` - Set the subject.
* `email.htmlBody(string)` - Set the HTML body of the email.
* `email.plainBody(string)` - Set the text/plain body of the email.
* `email.attachment(attachmentObject)` - Add one attachment to the email without overwriting any of the previous attachments. See the section "Attachments" above for the object shape.
* `email.attachments(arrayOfAttachmentObjects)` - Add multiple attachments to the email, replacing any previous attachments. See the section "Attachments" above for the object shape.
* `email.set(hashOfProperties)` - Update multiple properties at once by specifying a hash of properties where the keys are the same as the above function names.

All the above methods can be chained together e.g. `email.to(value).from(anotherValue);`.

## Handlers
Ultimail uses the concept of "handlers" which are essentially just specialised middleware functions that perform a specific action. There are three types of handlers: "templating", "styling", and "provider".

### Templating Handlers
A templating handler needs to be configured for each mailer and will be responsible for parsing the HTML and plain text body files in the template directory.

**Note:** By default, Ultimail comes configured with the [Ultimail-Templating-Handlebars](https://www.npmjs.com/package/ultimail-templating-handlebars) module so you do not need to configure a templating handler unless you wish to change it.

#### Configuring
To configure a templating handler:

```javascript
const Ultimail = require(`ultimail`);
const ultimailTemplatingHandlebars = require(`ultimail-templating-handlebars`);

const mailer = new Ultimail({ ... });

mailer.configure(`templating`, ultimailTemplatingHandlebars());
```

#### Writing Your Own
You can write your own templating middleware by following the conventions outlined below. See the source code of the [Ultimail-Templating-Handlebars](https://github.com/saikojosh/Ultimail-Templating-Handlebars) module for a working example.

##### Middleware Signature
Your middleware will be passed these parameters:

```javascript
function (email, actualTemplate, layoutTemplate, variables, options, next) { ... }
```

* `email` - The email Ultimail will be sending.
* `actualTemplate` - The email template object specified by the user.
* `layoutTemplate` - The layout template object, if one was specified.
* `variables` - The hash of variables that need to be replace in the templates.
* `options` - The options passed to the Ultimail constructor or method.
* `next` - Callback.

##### Callback Signature
You must always call the `next()` callback when you have finished, errors will be caught but it's a better practice to pass them to the callback. There is no need to pass the email back in the callback as this is handled automatically.

```javascript
return next(err);
```

##### Template Objects
Template files are automatically loaded from disk and converted to strings so you don't have to worry about that. The `actualTemplate` parameter is the email template specified by the user and the `layoutTemplate` is the layout, if one was specified. Both parameters are template objects which have the following shape:

```javascript
{
	htmlBody: String || null,
	plainBody: String || null,
	subject: String || null,
	css: String || null,
}
```

##### Merging the Template into the Layout
You should replace a variable called "template" in the layout templates with the contents of the actual email template.

##### Updating the Email
You can update the email by calling certain methods on it and passing in the output from your middleware:

* To update the HTML body: `email.htmlBody(htmlBody)`.
* To update the text/plain body: `email.plainBody(plainBody)`.
* To update the subject: `email.subject(subject)`.

### Styling Handlers
A styling handler needs to be configured for each mailer and will be responsible for parsing the CSS in the template directory and inlining it into the HTML body returned by the templating handler.

**Note:** By default, Ultimail comes configured with the [Ultimail-Styling-Inline-CSS](https://www.npmjs.com/package/ultimail-styling-inline-css) module so you do not need to configure a styling handler unless you wish to change it.

#### Configuring
To configure a styling handler:

```javascript
const Ultimail = require(`ultimail`);
const Ultimail = require(`ultimail`);
const ultimailStylingInlineCss = require(`ultimail-styling-inline-css`);

const mailer = new Ultimail({ ... });

mailer.configure(`styling`, ultimailStylingInlineCss());
```

#### Writing Your Own
You can write your own styling middleware by following the conventions outlined below. See the source code of the [Ultimail-Styling-Inline-CSS](https://github.com/saikojosh/Ultimail-Styling-Inline-CSS) module for a working example.

##### Middleware Signature
Your middleware will be passed these parameters:

```javascript
function (email, css, options, next) { ... }
```

* `email` - The email Ultimail will be sending.
* `css` - The CSS of the layout template (if any) and the CSS of the actual email template, concatenated together as a string.
* `options` - The options passed to the Ultimail constructor or method.
* `next` - Callback.

##### Callback Signature
You must always call the `next()` callback when you have finished, errors will be caught but it's a better practice to pass them to the callback. There is no need to pass the email back in the callback as this is handled automatically.

```javascript
return next(err);
```

##### Updating the Email
You can update the email by calling certain methods on it and passing in the output from your middleware:

* To update the HTML body: `email.htmlBody(htmlBody)`.

### Provider Handlers
A provider handler needs to be configured for each mailer and will be responsible for sending emails via the provider's API.

**Note:** Ultimail does NOT come with a pre-configured provider. You will need to configure one for your own use, for example the Postmark provider (see below).

#### Configuring
To configure a provider handler:

```javascript
const Ultimail = require(`ultimail`);
const ultimailProviderPostmark = require(`ultimail-provider-postmark`);

const mailer = new Ultimail({ ... });

mailer.configure(`provider`, ultimailProviderPostmark({
	apiKey: `my-postmark-server-api-key`,
}));
```

#### Writing Your Own
You can write your own provider middleware by following the conventions outlined below. See the source code of the [Ultimail-Provider-Postmark](https://github.com/saikojosh/Ultimail-Provider-Postmark) module for a working example.

##### Middleware Signature
Your middleware will be passed these parameters:

```javascript
function (email, options, next) { ... }
```

* `email` - The email you will be sending.
* `options` - The options passed to the Ultimail constructor or method.
* `next` - Callback.

##### Callback Signature
You must always call the `next()` callback when you have finished, errors will be caught but it's a better practice to pass them to the callback. You can pass back some sort of result value as the second parameter for the user to consume, but bear in mind the only way to signify an unsuccessful send operation is to pass back or throw an error.

```javascript
return next(err[, result]);
```

##### On Successful Send
When the email sends successfully you should either pass `true` as the second parameter to the `next()` callback, or pass back the response from the provider's API directly. Ultimail assumes the email has sent successfully unless you pass back or throw an error.

##### On Failure
When the email fails to send you should pass an error as the first parameter to the `next()` callback, or just throw an error. Ultimail assumes the email has sent successfully unless you pass back or throw an error.

## API Overview

### const mailer = new Ultimail([options]);
Creates a new mailer instance of the Ultimail class with the given global options. The options specified here will apply for all emails sent using this mailer, but they can all be overridden when preparing or sending emails.

| Option         | Default Value | Description |
|----------------|---------------|-------------|
| to             |               | An array of or comma-delimited string of default email addresses to send emails to via this mailer. |
| cc             |               | An array of or comma-delimited string of default email addresses to carbon copy emails to via this mailer. |
| bcc            |               | An array of or comma-delimited string of default email addresses to blind carbon copy emails to via this mailer. |
| from           |               | The default "from" address to attach to emails sent via this mailer. |
| replyTo        |               | The default "reply-to" address to attach to emails sent via this mailer. |
| subject				 |               | The default subject for emails sent via this mailer. This string will be parsed by the templating handler. |
| attachments    |               | A default array of attachments to include with emails sent via this mailer. See the section "Attachments" above for the object shape. |
| variables      |               | A default hash of variables to replace in the template files. |
| layoutTemplate |               | The path to the directory that contains the default layout template for emails sent via this mailer. |
| styles         | `true`        | Set to `false` to prevent CSS preparation by default on emails sent via this mailer. |

### \<promise\> = mailer.prepare(template[, options[, callback]]);
Returns a prepared Email object which can later be sent via `mailer.send()` or `email.send()`. Templates and CSS will be parsed and the appropriate options will be set on the email (see the constructor for the available options). If you specify the variables option the hash will be deep merged into the existing variables hash set on the constructor.

**Note:** This method is automatically called when you use the `mailer.send()` or `mailer.sendTo()` methods.

### \<promise\> = mailer.send(input[, options[, callback]]);
Same as the `mailer.prepare()` method but also sends the email immediately via the configured provider. The `input` parameter can either be an Email instance or a template directory.

### \<promise\> = mailer.sendTo(to, input, [options[, callback]]);
Same as the `mailer.prepare()` method but also sends the email immediately via the configured provider, and overwrites the "to" option (see the constructor for the option description). The `input` parameter can either be an Email instance or a template directory.

### \<promise\> = mailer.quickSend(options, htmlBody[, plainBody[, callback]]);
Sends an email via the configured provider immediately without parsing the HTML template or CSS. Instead, you pass the HTML and plain body of the email straight into this method.

### mailer.isEmail(input);
Returns true if the given input is an instance of the internal Email class created by Ultimail.

### \<promise\> = email.send([options]);
Sends a pre-prepared email. See the constructor for the available options.
