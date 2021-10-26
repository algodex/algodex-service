import DexError from './DexError.js';
import {getMessage} from '../index.js';
/**
 * Invalid Parameter
 */
export default class InvalidParameter extends DexError {
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
