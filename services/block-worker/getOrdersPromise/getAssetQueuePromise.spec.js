/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const getAssetQueuePromise = require('./getAssetQueuePromise');
const QueueMock = require('../../../src/__mocks__/QueueMock');

const queues = {
  orders: Object.create(QueueMock),
  assets: Object.create(QueueMock),
};

const getPromise2 = (assetQueue, assetId) => {
  const assetAddJob = {assetId: assetId};
  const promise = assetQueue.add('assets', assetAddJob,
      {removeOnComplete: true}).then(function() {
  });
  return promise;
};

it('gets asset queue promise', async () => {
  const queueMockTest = await queues.orders.add('aaa', 'bbb', 'ccc');
  expect(queueMockTest).toBe('added');
  const promiseRes = await getAssetQueuePromise(queues.assets, 55);
  expect(promiseRes).toBe('added');
});
