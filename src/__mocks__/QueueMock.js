/* eslint-disable require-jsdoc */

module.exports = {
  add: jest.fn(() => new Promise(resolve => {
    resolve('added');
  })),
};
