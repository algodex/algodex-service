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

// export {};
import algosdk from 'algosdk';

export interface DistributeRewardsInput {
  algodClient: algosdk.Algod,
  distributeNetwork: string,
  fromAccount: algosdk.Account,
  sendAssetId: number,
  indexer: algosdk.Indexer,
  dryRunWithDBSave?: boolean,
  dryRunNoSave?: boolean,
  removeOldFirst?: boolean
}

export const schema = {
  type: 'object',
  properties: {
    algodClient: {type: 'object'},
    dryRunWithDBSave: {type: 'boolean'},
    removeOldFirst: {type: 'boolean'},
    amount: {type: 'integer', minimum: 1},
    distributeNetwork: {type: 'string', pattern: '^(mainnet|testnet)$'},
    fromAccount: {
      type: 'object',
      properties: {
        addr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
      },
      required: ['addr'],
    },
    sendAssetId: {type: 'integer'},
    indexer: {type: 'object'},
  },
  required: ['algodClient', 'rewardsDB', 'wallets',
    'amount', 'epoch', 'network', 'accrualNetwork', 'fromAccount', 'assetId',
    'indexer'],
  additionalProperties: false,
};

// export {schema: {...schema}, DistributeRewardsInput};

// module.exports = () => {
//   return {schema: {...schema}, DistributeRewardsInput};
// };
