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

const addBlockToDB = require('./addBlockToDB');
const loadJson = require('../../src/loadJson');
const DatabaseMock = require('../../src/__mocks__/DatabaseMock');
const DatabaseGetNotFoundMock =
  require('../../src/__mocks__/DatabaseGetNotFoundMock');
const db = Object.create(DatabaseMock);
const dbGetNotFound = Object.create(DatabaseGetNotFoundMock);

it('adds block to DB', async () => {
  const obj = loadJson('../src/__tests__/schema/db/blocks.json');
  const promiseRes = await addBlockToDB(db, 44, obj);
  expect(promiseRes).toBe('posted');
  const promiseRes2 = await addBlockToDB(dbGetNotFound, 44, obj);
  expect(promiseRes2).toBe('posted');
  expect(db.get.mock.calls).toEqual(
      []);
  expect(dbGetNotFound.get.mock.calls).toEqual([]);
  expect(dbGetNotFound.post.mock.calls).toEqual([
    [
      {
        '_id': '15915394',
        'type': 'block',
        '_rev': '1-5392a37874ac1be33f5e20a5b3ee6be2',
        'earn': 27521,
        'fees': 'A7NMWS3NT3IUDMLVO26ULGXGIIOUQ3ND2TXSER6EBGRZNOBOUIQXHIBGDE',
        'frac': 2020197303,
        'gen': 'testnet-v1.0',
        'gh': 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
        'prev': 'blk-7NMU65BCMNX2C23DOFLCBPZQB4PTIPOE55CMO632LJE7I5I5CFUA',
        'proto': 'https://github.com/algorandfoundation/specs/tree/65b4ab3266c52c56a0fa7d591754887d68faad0a',
        'rnd': 15915394,
        'rwcalr': 16000000,
        'rwd': '7777777777777777777777777777777777777777777777777774MSJUVU',
        'seed': 'ktm/toPkJNxnkCpYFlFlHXH40XshsFP/4qYfLEZbnGw=',
        'tc': 22045552,
        'ts': 1628519402,
        'txn': 'GgZKbWni8nw0ZFiCy2850dp6ejaeJd/EII7WaPk1dxo=',
        'txns': [
          {
            'hgi': true,
            'sig': 'S70McaGWg9gdalpGahbGSiUpc0zwYhMutfDrY1eIeV/6NMOdwnuowIT2eBsU1vKa7s9qYdmUJF3kkSR/aW+pCA==',
            'txn': {
              'amt': 1,
              'fee': 1000,
              'fv': 15915393,
              'lv': 15915398,
              'note': 'cGluZ3Bvbmda73F7QtRIHQ==',
              'rcv': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
              'snd': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
              'type': 'pay',
            },
          },
          {
            'hgi': true,
            'sig': 'D9MnTxcfwg3PyVUtM+0WZl+5c8Ii7jy1aqJsxSIBgWL4QotPKT8uGnwakHM4f0r9DTgz7uD2eO4b7mXYTllIAA==',
            'txn': {
              'amt': 1,
              'fee': 1000,
              'fv': 15915393,
              'lv': 15915398,
              'note': 'cGluZ3Bvbme2/9Ws4knF8A==',
              'rcv': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
              'snd': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
              'type': 'pay',
            },
          },
          {
            'hgi': true,
            'sig': 'gJqJQ5r7Xwiv7UXXdcUX7ETyJhSuYDhGTjN8r8QzMpuVPp3EJzb+qz7ZUGs5k9+hzRzdQGiV4vY0V2E/Rtg2BQ==',
            'txn': {
              'amt': 1,
              'fee': 1000,
              'fv': 15915393,
              'lv': 15915398,
              'note': 'cGluZ3BvbmeaY7bPTWjGbw==',
              'rcv': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
              'snd': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
              'type': 'pay',
            },
          },
          {
            'hgi': true,
            'sig': 'XSno9InmWQL7QvnKwq8xvmxYnExasPm5QEOblkX+/0jFKsqbODztHndZ5+2KPgUVHXA7oG0wDjEVJjfJ2glsDA==',
            'txn': {
              'amt': 1,
              'fee': 1000,
              'fv': 15915393,
              'lv': 15915398,
              'note': 'cGluZ3Bvbmc6Wntk9c092g==',
              'rcv': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
              'snd': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
              'type': 'pay',
            },
          },
        ],
      },
    ],
  ]);
});
