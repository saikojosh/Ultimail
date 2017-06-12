'use strict';

/*
 * EXAMPLE: using mailer.quickSend()
 */

/* eslint no-console: 0 */
/* eslint node/no-unpublished-require: 0 */

const Ultimail = require(`../ultimail`);
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
	apiKey: `my-postmark-server-api-key`,
}));

// Add a general middleware.
mailer.use((email, options, next) => {
	console.log(`Middleware email:`, email);
	return next();
});

// Prepare some variables.
const options = {
	to: `user-email@aw-ltd.co.uk`,
	variables: {
		firstName: `Josh`,
		lastName: `Cole`,
	},
};
const htmlBody = `<h1>Hello, {{firstName}}!</h1>`;
const plainBody = `Hello, {{firstName}}!`;

// Send the email without preparing any templates or CSS.
mailer.quickSend(options, htmlBody, plainBody)
	.then(result => console.log(`result`, result))
	.catch(err => console.error(err));
