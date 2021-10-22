// eslint-disable-next-line require-jsdoc
class Queue {
  /**
   * Create Queue
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }

  process = (fn) => {
    console.log(`Registered function ${this.name}`);
    this.processFn = fn;
  };

  add = (data) => {
    console.log(`Running ${this.name}`);
    return this.processFn({data});
  };
}

// module.exports = Queue;
