const Ajv = require('ajv');
const InvalidParameter = require('./errors/InvalidParameter');

const ajv = new Ajv({useDefaults: true, allErrors: true});
const schema = require('./models/message.json');

/**
 *
 * @param {object} message
 * @return {*}
 */
module.exports = function getMessage(message) {
  const valid = ajv.validate(schema, message);
  if (!valid) {
    throw new InvalidParameter(JSON.stringify(ajv.errors[0].message));
  }
  return message;
};
