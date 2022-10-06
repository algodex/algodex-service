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


test('has replaced view names', () => {
  process.env.ALGODEX_ALGO_ESCROW_APP = '1312312312';
  process.env.TINYMAN_APP = '21332131';
  const dbConfig = require('./db-config')();

  const viewMap = dbConfig[0].design.views.orders.map;


  expect(viewMap.includes('txn.txn.apid === \'<ALGODEX_ALGO_ESCROW_APP>\'')).toBe(false);
  expect(viewMap.includes(`txn.txn.apid === ${process.env.ALGODEX_ALGO_ESCROW_APP}`)).toBe(true);

  const tinyManMap = dbConfig[0].design.views.tinymanTrades.map;
  expect(tinyManMap.includes('.filter(txn => txn.apid === \'<TINYMAN_APP>\')')).toBe(false);
  expect(tinyManMap.includes(`.filter(txn => txn.apid === ${process.env.TINYMAN_APP})`)).toBe(true);

  expect(process.env.TINYMAN_APP.length > 0).toBe(true);
  expect(process.env.ALGODEX_ALGO_ESCROW_APP.length > 0).toBe(true);
});
