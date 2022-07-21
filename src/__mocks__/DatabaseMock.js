/* eslint-disable no-undef */
/* eslint-disable require-jsdoc */

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.error = 'not_found';
  }
}

module.exports = {
  DatabaseMock: Object.create({
    post: jest.fn(() => new Promise(resolve => {
      resolve('posted');
    })),
    get: jest.fn(() => new Promise(resolve => {
      resolve('get');
    })),
  }),
  DatabaseGetNotFoundMock: Object.create({
    post: jest.fn(() => new Promise(resolve => {
      resolve('posted');
    })),
    get: jest.fn(() => new Promise(resolve => {
      throw new NotFoundError;
    })),
  }),
  DatabaseBadErrorMock: Object.create({
    post: jest.fn(() => new Promise(resolve => {
      throw new Error('bad post error');
    })),
    get: jest.fn(() => new Promise(resolve => {
      throw new Error('bad get error');
    })),
  }),
};

