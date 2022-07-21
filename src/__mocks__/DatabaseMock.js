/* eslint-disable no-undef */
/* eslint-disable require-jsdoc */

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.error = 'not_found';
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.error = 'conflict';
  }
}

class UnexpectedError extends Error {
  constructor(message) {
    super(message);
    this.error = 'unexpected error';
  }
}

module.exports = {
  NotFoundError, ConflictError, UnexpectedError,
  DatabaseMock: Object.create({
    post: jest.fn(() => new Promise(resolve => {
      resolve('posted');
    })),
    put: jest.fn(() => new Promise(resolve => {
      resolve('put');
    })),
    get: jest.fn(() => new Promise(resolve => {
      resolve('get');
    })),
    query: jest.fn(() => new Promise(resolve => {
      resolve('queried');
    })),
  }),
  DatabaseExpectedErrorMock: Object.create({
    post: jest.fn(() => new Promise(resolve => {
      resolve('posted');
    })),
    put: jest.fn(() => new Promise(resolve => {
      throw new ConflictError;
    })),
    get: jest.fn(() => new Promise(resolve => {
      throw new NotFoundError;
    })),
  }),
  DatabaseBadErrorMock: Object.create({
    post: jest.fn(() => new Promise(resolve => {
      throw new UnexpectedError;
    })),
    put: jest.fn(() => new Promise(resolve => {
      throw new UnexpectedError;
    })),
    get: jest.fn(() => new Promise(resolve => {
      throw new UnexpectedError;
    })),
  }),
};

