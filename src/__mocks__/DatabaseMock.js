/* eslint-disable no-undef */
/* eslint-disable require-jsdoc */

module.exports = {
  DatabaseMock: {
    post: jest.fn(() => new Promise(resolve => {
      resolve('posted');
    })),
    get: jest.fn(() => new Promise(resolve => {
      resolve('get');
    })),
  },
  DatabaseGetNotFoundMock: {
    post: jest.fn(() => new Promise(resolve => {
      resolve('posted');
    })),
    get: jest.fn(() => new Promise(resolve => {
      throw {'error': 'not_found'};
    })),
  },
};

