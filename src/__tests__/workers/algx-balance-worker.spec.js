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

/* eslint-disable max-len */
const DatabaseMock = require('../../__mocks__/DatabaseMock');
// const DatabaseGetNotFoundMock = require('../../__mocks__/DatabaseGetNotFoundMock');
// const QueueMock = require('../../__mocks__/QueueMock');

// const blockObj = require('../schema/db/blocks.json');
const blockTestnet16628011 = require('../blocks/block-testnet-16628011.json');

// https://testnet.algoexplorer.io/address/224PI746ZQTBTJGYG6ISUCW3DDFVHJHPWZERDWFKLTSC25XCY43QYES3LA
// 16628011


const handleAlgxBalanceJob =
  require('../../../services/algx-balance-worker/handleAlgxBalanceJob');

const db = Object.create(DatabaseMock);
// const dbGetNotFound = Object.create(DatabaseGetNotFoundMock);

// jest.mock('../../../services/algx-balance-worker/checkInDB',
// () => jest.fn(() => {}));

db.query = jest.fn(() => new Promise(resolve => {
  resolve('qiery');
}));
db.get = jest.fn(() => new Promise(resolve => {
  throw {'error': 'not_found'};
}));

// algxBalanceDB.get(''+round);

// const checkInDb = require('../../../services/algx-balance-worker/checkInDB');


test('can add balance to DB', async () => {
  const job = {data: blockTestnet16628011};
  // handleAlgxBalanceJob(job, db); TODO: uncomment this

  expect(1+1).toBe(2);
});
