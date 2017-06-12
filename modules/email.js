'use strict';

/*
 * EMAIL
 */

const extender = require(`object-extender`);

module.exports = class Email {

	/*
	 * Instantiate a new email with empty values for all properties.
	 */
	constructor (_properties) {

		// Default values.
		this.properties = {
			to: [],
			cc: [],
			bcc: [],
			from: null,
			replyTo: null,
			subject: null,
			htmlBody: null,
			plainBody: null,
			attachments: [],
		};

		// Correctly set the properties if a hash was passed in.
		if (_properties) { this.set(_properties); }

	}

	to (value) {
		this.properties.to = this.__parseAddresses(value);
		return this;
	}

	cc (value) {
		this.properties.cc = this.__parseAddresses(value);
		return this;
	}

	bcc (value) {
		this.properties.bcc = this.__parseAddresses(value);
		return this;
	}

	from (value) {
		this.properties.from = this.__parseString(value);
		return this;
	}

	replyTo (value) {
		this.properties.replyTo = this.__parseString(value);
		return this;
	}

	subject (value) {
		this.properties.subject = this.__parseString(value);
		return this;
	}

	htmlBody (value) {
		this.properties.htmlBody = this.__parseString(value);
		return this;
	}

	plainBody (value) {
		this.properties.plainBody = this.__parseString(value);
		return this;
	}

	attachment (filename, mimeType, buf) {
		this.properties.attachments.push({
			filename,
			mimeType,
			buf,
		});
		return this;
	}

	attachments (attachments) {
		this.properties.attachments = [];
		if (attachments) { attachments.forEach(value => this.attachment(value.filename, value.mimeType, value.buf)); }
		return this;
	}

	/*
	 * Allows setting multiple values at once.
	 */
	set (values) {

		if (typeof values !== `object` && !Array.isArray(values)) {
			throw new Error(`You must provide a hash of values to the .set() method.`);
		}

		// Set each value in turn.
		Object.keys(values).forEach(key => {
			const value = values[key];
			const setter = this[key];
			if (typeof setter === `function`) { setter.call(this, value); }
		});

	}

	/*
	 * Returns a raw copy of the email, or a single property if key is specified.
	 */
	get (key) {
		const raw = extender.clone(this.properties);
		return raw[key];
	}

	/*
	 * Takes either a comma-delimited string of email address or an array of email addresses and returns an array.
	 */
	__parseAddresses (input) {

		let array;

		if (typeof input === `string`) {
			array = input.split(`,`);
		}
		else if (Array.isArray(input)) {
			array = input;
		}
		else {
			array = [];
		}

		return array.map(item => item.trim());

	}

	/*
	 * Ensures string values are trimmed.
	 */
	__parseString (input) {
		return (typeof input === `string` ? input.trim() : null);
	}

};
