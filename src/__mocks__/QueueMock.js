/* eslint-disable require-jsdoc */
/* eslint-disable no-undef */

module.exports = {
  add: jest.fn(() => new Promise(resolve => {
    resolve('added');
  })),
};

