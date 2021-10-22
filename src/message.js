import Ajv from 'ajv';
import {InvalidParameter} from './errors/index.js';
import schema from './models/message.json';
const ajv = new Ajv({useDefaults: true, allErrors: true});

// const Ajv = require('ajv');
// const InvalidParameter = require('./errors/InvalidParameter');
//
// const ajv = new Ajv({useDefaults: true, allErrors: true});
// const schema = require('./models/message.json');

/**
 *
 * @param {object} message
 * @return {*}
 */
export default function getMessage(message) {
// module.exports = function getMessage(message) {
  const valid = ajv.validate(schema, message);
  if (!valid) {
    throw new InvalidParameter(JSON.stringify(ajv.errors[0].message));
  }
  return message;
};
