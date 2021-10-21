/**
 * Standard Error
 */
class DexError extends Error {
  /**
   * Invalid Configuration
   * @param {string} message
   */
  constructor({type, description, name}) {
    // Validate message
    super(`${type}: ${description}`);
    this.name = name;
  }
}


module.exports = DexError;
