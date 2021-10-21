const DexError = require('./DexError');
/**
 * Invalid Parameter
 */
class InvalidParameter extends DexError {
  /**
   * Invalid Parameter
   * @param {string} description
   */
  constructor(description) {
    const getMessage = require('../message');
    super(
        getMessage({
          name: 'InvalidParameter',
          type: 'error',
          description,
        }),
    );
  }
}

module.exports = InvalidParameter;
