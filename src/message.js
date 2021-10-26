import Ajv from 'ajv';
import {InvalidParameter} from './index.js';
import {createRequire} from 'module';

const ajv = new Ajv({useDefaults: true, allErrors: true});
const require = createRequire(import.meta.url);

/**
 *
 * @param {object} message
 * @return {*}
 */
export default function getMessage(message) {
  const schema = require('./models/message.json');
  const valid = ajv.validate(schema, message);
  if (!valid) {
    throw new InvalidParameter(JSON.stringify(ajv.errors[0].message));
  }
  return message;
};
