/* eslint-disable max-len */
const DatabaseMock = require('../../__mocks__/DatabaseMock');
const DatabaseGetNotFoundMock = require('../../__mocks__/DatabaseGetNotFoundMock');
const QueueMock = require('../../__mocks__/QueueMock');

const blockObj = require('../schema/db/blocks.json');


const handleAlgxBalanceJob =
  require('../../../services/algx-balance-worker/handleAlgxBalanceJob');


const db = Object.create(DatabaseMock);
const dbGetNotFound = Object.create(DatabaseGetNotFoundMock);

// jest.mock('../../../services/algx-balance-worker/checkInDB',
// () => jest.fn(() => {}));

const checkInDb = require('../../../services/algx-balance-worker/checkInDB');

test('can add balance to DB', async () => {
  const job = {data: blockObj};
  const spy = jest.spyOn(checkInDb);
  handleAlgxBalanceJob(job, db);
  expect(spy).toHaveBeenCalled();

  expect(1+1).toBe(2);
});
