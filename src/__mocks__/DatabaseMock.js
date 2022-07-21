/* eslint-disable require-jsdoc */

module.exports = {
  post: jest.fn(() => new Promise(resolve => {
    resolve('posted');
  })),
  get: jest.fn(() => new Promise(resolve => {
    resolve('get');
  })),
};

