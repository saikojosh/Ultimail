'use strict';

/*
 * EXAMPLE: using mailer.prepare()
 */

/* eslint no-console: 0 */

const path = require(`path`);
const Ultimail = require(`../ultimail`);

// Create a new mailer.
const mailer = new Ultimail({
	from: `webmaster@aw-ltd.co.uk`,
	styles: true,
	variables: {
		brandName: `Amazing Widgets Ltd`,
		website: `http://www.aw-ltd.co.uk`,
	},
});

// Add a general middleware.
mailer.use((email, options, next) => {
	console.log(`Middleware email:`, email);
	return next();
});

// Prepare some variables.
const templateDir = path.join(__dirname, `/emailTemplates/welcome`);
const options = {
	to: `user-email@aw-ltd.co.uk`,
	variables: {
		firstName: `Josh`,
		lastName: `Cole`,
	},
};

// Prepare an email for sending later.
mailer.prepare(templateDir, options)
	.then(email => console.log(`email`, email))
	.catch(err => console.error(err));
