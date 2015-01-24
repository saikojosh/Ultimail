/*
 * Handlebars view engine.
 */

var ME         = module.exports;
var handlebars = require('handlebars');

/*
 * Initialise the view engine.
 */
ME.init = function (options) {

  // Not required for handlebars.

};

/*
 * Process the input with the view engine.
 * callback(err, output);
 */
ME.process = function (input, variables, callback) {

  // Compile the handlebars template.
  try {
    var hbTpl  = handlebars.compile(input);
    var output = hbTpl(variables);
  }
  catch (err) {
    return callback(err);
  }

  // Success!
  return callback(null, output);

};