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

const schema = {
  type: 'object',
  properties: {
    algodClient: {type: 'object'},
    rewardsDB: {type: 'object'},
    wallets: {
      type: 'array',
      items: {type: 'string', pattern: '^[A-Z2-7]{58}$', uniqueItems: true},
    },
    amount: {type: 'integer', minimum: 1},
    epoch: {type: 'integer'},
    network: {type: 'string', pattern: '^(mainnet|testnet)$'},
    accrualNetwork: {type: 'string', pattern: '^(mainnet|testnet)$'},
    fromAccount: {
      type: 'object',
      properties: {
        addr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
      },
      required: ['addr'],
    },
    assetId: {type: 'integer'},
    indexer: {type: 'object'},
  },
  required: ['algodClient', 'rewardsDB', 'wallets',
    'amount', 'epoch', 'network', 'accrualNetwork', 'fromAccount', 'assetId',
    'indexer'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};


