const getAssetQueuePromise = require('./getAssetQueuePromise');
const QueueMock = require('../../../src/__mocks__/QueueMock');

const queues = {
  orders: Object.create(QueueMock),
  assets: Object.create(QueueMock),
};


it('gets asset queue promise', async () => {
  const queueMockTest = await queues.orders.add('aaa', 'bbb', 'ccc');
  expect(queueMockTest).toBe('added');
  const promiseRes = await getAssetQueuePromise(queues.assets, 55);
  expect(promiseRes).toBe('added');
});
