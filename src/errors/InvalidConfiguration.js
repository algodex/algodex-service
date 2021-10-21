const DexError = require('./DexError');
/**
 * Invalid Configuration Error
 */
class InvalidConfiguration extends DexError {
  /**
   * Invalid Configuration
   * @param {string} description
   * @param {string} data
   */
  constructor(description, data) {
    const getMessage = require('../message');
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

module.exports = InvalidConfiguration;
