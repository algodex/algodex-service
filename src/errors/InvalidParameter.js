import DexError from './DexError.js';
import getMessage from '../message.js';
// const DexError = require('./DexError');
/**
 * Invalid Parameter
 */
export default class InvalidParameter extends DexError {
// class InvalidParameter extends DexError {
  /**
   * Invalid Parameter
   * @param {string} description
   */
  constructor(description) {
    super(
        getMessage({
          name: 'InvalidParameter',
          type: 'error',
          description,
        }),
    );
  }
}

// module.exports = InvalidParameter;
