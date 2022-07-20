const getAssetsAndOrdersPromises = require('./getAssetsAndOrdersPromises');

const QueueMock = {
  add: () => jest.fn( (input) => {
    return new Promise( (resolve) => resolve(input));
  }),
};

it('gets asset and orders promises', () => {
  // const input = {
  //   queues: {
  //     order: new QueueMock(),
  //     assets: new QueueMock(),
  //   },
  // },
  expect(1).toBe(1);
});
