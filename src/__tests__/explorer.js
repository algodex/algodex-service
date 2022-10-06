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

const {InvalidConfiguration} = require('../Errors');
const explorer = require('../explorer');

test.skip('get a block from explorer', async () => {
  await explorer.getBlock({round: 1986})
      .catch(e => expect(e).toBeInstanceOf(InvalidConfiguration));

  process.env.ALGORAND_EXPLORER = 'https://api.testnet.algoexplorer.io';
  const block = await explorer.getBlock({round: 1986});

  expect(block).toEqual(require('./blocks/block-testnet-1986.json'));
});

test.skip('wait for block from explorer', async () => {
  await explorer.waitForBlock({round: 1986})
      .catch(e => expect(e).toBeInstanceOf(InvalidConfiguration));

  process.env.ALGORAND_EXPLORER = 'https://api.testnet.algoexplorer.io';
  const block = await explorer.waitForBlock({round: 1986});
  expect(block['last-round']).toBeGreaterThan(0);
});

test.skip('get applications block range', async () => {
  const apps =[
    {
      id: 22045503,
      genesis: undefined,
    },
    {
      id: 22045522,
      genesis: undefined,
    },
  ];

  await explorer.getAppsBlockRange(apps)
      .catch(e => expect(e).toBeInstanceOf(InvalidConfiguration));

  process.env.ALGORAND_EXPLORER = 'https://testnet.algoexplorerapi.io';
  const range = await explorer.getAppsBlockRange(apps);

  expect(range.start).toEqual(15915387);
  expect(range.current).toBeGreaterThanOrEqual(15915387);
});
