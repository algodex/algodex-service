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
const blockMainnet22461067 = require('../../src/__tests__/blocks/block-mainnet-22461067.json');
const blockMainnet22461068 = require('../../src/__tests__/blocks/blocks-mainnet-22461068.json');
const blocksMainnet22471065 = require('../../src/__tests__/blocks/blocks-mainnet-22471065.json');
const hasAlgxChanges = require('./hasAlgxChanges');


it('has algx changes', () => {
  process.env.ALGX_ASSET_ID='724480511';
  expect(hasAlgxChanges(blockMainnet22461067)).toBe(true);
  expect(hasAlgxChanges(blockMainnet22461068)).toBe(false);
  expect(hasAlgxChanges(blocksMainnet22471065)).toBe(true);
});
