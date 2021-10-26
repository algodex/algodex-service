// eslint-disable-next-line
class Queue {
  /**
   * Create Queue
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Process Queue
   * @param {function} fn
   */
  process(fn) {
    console.log(`Registered function ${this.name}`);
    this.processFn = fn;
  };

  /**
   * Add Data
   * @param {object} data
   * @return {*}
   */
  add(data) {
    console.log(`Running ${this.name}`);
    return this.processFn({data});
  };
}

// module.exports = Queue;
