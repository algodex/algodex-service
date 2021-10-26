import DexError from './DexError.js';
import {getMessage} from '../index.js';
/**
 * Invalid Configuration Error
 */
export default class InvalidConfiguration extends DexError {
  /**
   * Invalid Configuration
   * @param {string} description
   * @param {string} [data]
   */
  constructor(description, data) {
    const msg = getMessage({
      name: 'InvalidConfiguration',
      type: 'error',
      description,
      data,
    });
    super(msg);
  }
}

// module.exports = InvalidConfiguration;
