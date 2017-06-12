'use strict';

const filesystem = require(`fs`);
const path = require(`path`);
const MiddlewareEngine = require(`middleware-engine`);
const extender = require(`object-extender`);
const ultimailStylingInlineCss = require(`ultimail-styling-inline-css`);
const ultimailTemplatingHandlebars = require(`ultimail-templating-handlebars`);
const Email = require(`./modules/email`);

module.exports = class Ultimail extends MiddlewareEngine {

	/*
	 * Instantiate a new mailer.
	 */
	constructor (_options) {

		// Setup the middleware engine.
		super({
			chainMiddlewareResults: false,
			throwOnMissingHandler: false,
		});

		// Ultimail specific options.
		this.options = extender.defaults({
			to: null,
			cc: null,
			bcc: null,
			from: null,
			replyTo: null,
			subject: null,
			attachments: null,
			variables: null,
			layoutTemplate: null,
			styles: true,
		}, _options);

		// Configure the default handlers to simplify quick use.
		this.configure(`templating`, ultimailTemplatingHandlebars());
		this.configure(`styling`, ultimailStylingInlineCss());

	}

	/*
	 * Prepares a new email for sending but does not send it.
	 */
	prepare (template, _options, callback = null) {

		const options = extender.merge(this.options, _options);
		const email = new Email(options);
		const promise = this.__prepareEmail(email, template, options);

		if (typeof callback === `function`) {
			promise.then(() => callback(null, email)).catch(err => callback(err));
		}
		else {
			return promise.then(() => email);
		}

	}

	/*
	 * Prepare and send an email. Accepts a template path or an email object as the input.
	 */
	send (input, _options = null, callback = null) {

		const options = extender.merge(this.options, _options);
		let template;
		let email;
		let needsPreparation;

		// If we have been given a template path lets create a new email.
		if (!this.isEmail(input)) {
			template = input;
			email = new Email(options);
			needsPreparation = true;
		}
		else {
			template = null;
			email = input;
			const canOverrideOptions = Boolean(_options);
			if (canOverrideOptions) { email.set(options); }  // Some of the options may override the existing email's settings.
			needsPreparation = false;
		}

		// Prepare and send the email.
		const promise = Promise.resolve()
			.then(() => {
				if (needsPreparation) { return this.__prepareEmail(email, template, options); }
			})
			.then(() => this.__sendEmail(email, options));

		if (typeof callback === `function`) {
			promise.then(result => callback(null, result)).catch(err => callback(err));
		}
		else {
			return promise.then(result => result);
		}

	}

	/*
	 * Send to the specific address(es) specified.
	 */
	sendTo (to, input, _options = null, callback = null) {
		const options = _options || {};
		options.to = to;
		return this.send(input, options, callback);
	}

	/*
	 * Quickly send an email with the given HTML and/or plain bodies without executing any of the handlers or middleware,
	 * except for the "provider" handler used to send the email.
	 */
	quickSend (_options, htmlBody, plainBody, callback = null) {

		const options = extender.merge(this.options, _options);
		const email = new Email(options);

		if (htmlBody) { email.htmlBody(htmlBody); }
		if (plainBody) { email.plainBody(plainBody); }

		const promise = this.__sendEmail(email, options);

		if (typeof callback === `function`) {
			promise.then(result => callback(null, result)).catch(err => callback(err));
		}
		else {
			return promise.then(result => result);
		}

	}

	/*
	 * Returns true if the given input is an instance of the email class.
	 */
	isEmail (input) {
		return (input instanceof Email);
	}

	/*
	 * Merge together some default variables, the options and the variables specified in the options.
	 */
	__prepareVariables (options, extraVariables) {

		return extender.merge(
			{},
			options,
			options.variables,
			extraVariables
		);

	}

	/*
	 * Loads and returns the given file.
	 */
	__loadFile (cache, cacheKey, filename) {

		return new Promise((resolve, reject) => {

			filesystem.readFile(filename, `utf8`, (err, data) => {
				if (err && err.code !== `ENOENT`) { return reject(err); }
				cache[cacheKey] = data || ``;
				return resolve();
			});

		});

	}

	/*
	 * Loads and returns all the files relating to the given template.
	 */
	__loadTemplate (template) {

		// No template to load.
		if (!template) { return null; }

		const cache = {
			htmlBody: null,
			plainBody: null,
			subject: null,
			css: null,
		};

		const htmlBodyFile = path.join(template, `body.html`);
		const plainBodyFile = path.join(template, `body.txt`);
		const subjectFile = path.join(template, `subject.txt`);
		const cssFile = path.join(template, `styles.css`);

		// Load all the files relating to the template and return them as a hash of strings.
		return Promise.resolve()
			.then(() => this.__loadFile(cache, `htmlBody`, htmlBodyFile))
			.then(() => this.__loadFile(cache, `plainBody`, plainBodyFile))
			.then(() => this.__loadFile(cache, `subject`, subjectFile))
			.then(() => this.__loadFile(cache, `css`, cssFile))
			.then(() => {
				if (!cache.htmlBody && !cache.plainBody) {
					throw new Error(`Can't find either "body.html" or "body.txt". At least one must exist in "${template}".`);
				}
				return cache;
			});

	}

	/*
	 * Converts the given path to an absolute path (using the current working directory of the process) if one only a
	 * relative path is provided. Returns null if an invalid path is provided.
	 */
	__getAbsolutePath (input) {
		if (!input || typeof input !== `string`) { return null; }
		return (path.isAbsolute(input) ? input : path.join(process.cwd(), input));
	}

	/*
	 * Prepares the given email using the given template and options.
	 */
	__prepareEmail (email, template, options) {

		const actualTemplatePath = this.__getAbsolutePath(template);
		const layoutTemplatePath = this.__getAbsolutePath(options.layoutTemplate);

		return Promise.resolve()

			// Load both templates.
			.then(() => this.__loadTemplate(actualTemplatePath))
			.then(actualTemplate =>
				Promise.all([
					actualTemplate,
					this.__loadTemplate(layoutTemplatePath),
				])
			)

			// Prepare both templates.
			.then(([ actualTemplate, layoutTemplate ]) =>
				this.__prepareTemplates(email, options, actualTemplate, layoutTemplate)
			)

			// Prepare both styles.
			.then(([ actualTemplate, layoutTemplate ]) =>
				this.__prepareStyles(email, options, actualTemplate, layoutTemplate)
			)

			// Run any remaining middleware.
			.then(() => this.__executeMiddleware(email, options))

			// Attach the send method to the email itself to allow "email.send(options);".
			.then(() => email.send = this.__sendEmail.bind(this, email));

	}

	/*
	 * Compile the actual (and optional layout) template.
	 */
	__prepareTemplates (email, options, actualTemplate, layoutTemplate) {

		if (!actualTemplate) { throw new Error(`You must provide the path to a template directory.`); }

		// If a subject was passed as an option that takes precedence.
		if (options.subject) {
			actualTemplate.subject = options.subject;
			if (layoutTemplate) { layoutTemplate.subject = options.subject; }
		}

		// Otherwise, attempt to ensure both templates have a subject from the the subject.txt files.
		else if (layoutTemplate) {
			if (actualTemplate.subject) { layoutTemplate.subject = actualTemplate.subject; }
			else { actualTemplate.subject = layoutTemplate.subject; }
		}

		// Render the templates.
		const extraVariables = (actualTemplate.subject ? { subject: actualTemplate.subject } : null);
		const variables = this.__prepareVariables(options, extraVariables);

		return this.__executeHandler(`templating`, email, actualTemplate, layoutTemplate, variables, options)
			.then(() => [ actualTemplate, layoutTemplate]);

	}

	/*
	 * Compile the CSS and merge it into the HTML.
	 */
	__prepareStyles (email, options, actualTemplate, layoutTemplate) {

		// Do nothing if styles have been turned off or we don't have an HTML portion to our email.
		if (!options.styles || !email.get(`htmlBody`)) { return Promise.resolve(); }

		// Render the CSS.
		const layoutCss = (layoutTemplate ? layoutTemplate.css : null) || ``;
		const actualCss = actualTemplate.css || ``;
		const css = `${layoutCss}\n\n${actualCss}`;

		return this.__executeHandler(`styling`, email, css, options)
			.then(() => [ actualTemplate, layoutTemplate]);

	}

	/*
	 * Sends the given email, making sure we have all the required properties.
	 */
	__sendEmail (email, options) {

		if (!email.get(`to`) || !email.get(`to`).length) {
			throw new Error(`You must specify at least one "to" email address.`);
		}

		if (!email.get(`subject`)) {
			throw new Error(`You must specify a subject.`);
		}

		if (!email.get(`from`)) {
			throw new Error(`You must specify a from address.`);
		}

		if (!email.get(`htmlBody`) && !email.get(`plainBody`)) {
			throw new Error(`Either a "htmlBody" or a "plainBody" needs to be specified.`);
		}

		if (this.isConfigured(`provider`)) {
			throw new Error(`You must configure a "provider" handler to send emails.`);
		}

		return this.__executeHandler(`provider`, email, options);

	}

};
