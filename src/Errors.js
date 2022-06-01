/**
 * Invalid Configuration
 */
class InvalidConfiguration extends Error {
  /**
   * Invalid Configuration
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'InvalidConfiguration';
  }
}

/**
 * Invalid Parameter
 */
class InvalidParameter extends Error {
  /**
   * Invalid Parameter
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'InvalidParameter';
  }
}

module.exports = {
  InvalidConfiguration,
  InvalidParameter,
};
