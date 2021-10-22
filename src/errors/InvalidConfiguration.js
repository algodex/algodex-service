import {DexError} from './index.js';
import getMessage from '../message.js';
// const DexError = require('./DexError');
/**
 * Invalid Configuration Error
 */
//class InvalidConfiguration extends DexError {
export default class InvalidConfiguration extends DexError {
  /**
   * Invalid Configuration
   * @param {string} description
   * @param {string} data
   */
  constructor(description, data) {
    super(
        getMessage({
          name: 'InvalidConfiguration',
          type: 'error',
          description,
          data,
        }),
    );
  }
}

// module.exports = InvalidConfiguration;
