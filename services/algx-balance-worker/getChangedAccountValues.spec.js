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
const blockTestnet16627873 = require('../../src/__tests__/blocks/block-testnet-16627873.json');
const blockMainnet22471132 = require('../../src/__tests__/blocks/block-mainnet-22471132.json');
const getChangedAccountValues = require('./getChangedAccountValues');


test('gets correct changed values', () => {
  const ownerToBalanceMap = new Map();
  process.env.ALGX_ASSET_ID = '15322902';
  ownerToBalanceMap.set('4WD4SFG5LF4WJLQ7E7MHY7L7S2A6HPBXNYXRYFS2V7HONO5UMKMEAUPX3A',
      {
        'balance': 174082,
        'round': 1662786,
      });
  const changedValues = getChangedAccountValues(ownerToBalanceMap, blockTestnet16627873);
  expect(changedValues).toEqual(
      [{'account': '4WD4SFG5LF4WJLQ7E7MHY7L7S2A6HPBXNYXRYFS2V7HONO5UMKMEAUPX3A',
        'balance': 164830},
      {'account': 'DUE565PAEADF3L5PNQ7TJNGEDZ5GN7STBUM2LSFVSBMZKSHV52U46SVFWI',
        'balance': 9252}]);
  // expect(changedValues)
});

test('gets inner txn values', () => {
  const ownerToBalanceMap = new Map();
  process.env.ALGX_ASSET_ID = '724480511';
  ownerToBalanceMap.set('TFQY6FMXEN5KXXJS3G7PT6JI6WCYNJ77AK76GQAQQ6JWW5K2EORI4UTWYE',
      {
        'balance': 7760470533005+100000,
        'round': 1662786,
      });
  ownerToBalanceMap.set('AZNLR2URGFUPZNT75LQ36MA4IPNXIOZZPMFSDCNPKQ6H3E3L252LY2VFY4',
      {
        'balance': 100,
        'round': 44,
      });
  const changedValues = getChangedAccountValues(ownerToBalanceMap, blockMainnet22471132);
  expect(changedValues).toEqual(
      [{'account': 'TFQY6FMXEN5KXXJS3G7PT6JI6WCYNJ77AK76GQAQQ6JWW5K2EORI4UTWYE',
        'balance': 100000},
      {'account': 'AZNLR2URGFUPZNT75LQ36MA4IPNXIOZZPMFSDCNPKQ6H3E3L252LY2VFY4',
        'balance': 100+7760470533005}]);
});
