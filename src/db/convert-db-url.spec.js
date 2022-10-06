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

const convertURL = require('./convert-db-url');

test('converts url', () => {
  process.env.INTEGRATION_TEST_MODE = '1';
  const converted = convertURL('http://admin@dex:localhost:2131/escrow');
  expect(converted).toEqual('http://admin@dex:localhost:2131/integration_test__escrow');

  process.env.INTEGRATION_TEST_MODE = '0';
  const converted2 = convertURL('http://admin@dex:localhost:2131/escrow');
  expect(converted2).toEqual('http://admin@dex:localhost:2131/escrow');

  delete process.env.INTEGRATION_TEST_MODE;
  const converted3 = convertURL('http://admin@dex:localhost:2131/escrow');
  expect(converted3).toEqual('http://admin@dex:localhost:2131/escrow');
});
