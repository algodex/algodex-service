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

export interface VestedRewards {
  _id: string,
  _rev?: string,
  ownerWallet: string,
  vestedRewards: number,
  formattedVestedRewards: number,
  epoch: number,
  vestedUnixTime: number,
  sentAssetId: number,
  accrualAssetId: number,
  result: string,
  transactionId: string,
  fromWallet: string,
  error?: string
}

export const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    ownerWallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    vestedRewards: {type: 'integer', minimum: 0},
    formattedVestedRewards: {type: 'number', minimum: 0},
    epoch: {type: 'integer', minimum: 1},
    vestedUnixTime: {type: 'integer', minimum: 0},
    sentAssetId: {type: 'number', minimum: 0},
    accrualAssetId: {type: 'number', minimum: 0},
    result: {type: 'string'},
    transactionId: {type: 'string'},
    fromWallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    error: {type: 'string'},
  },
  required: ['_id', 'ownerWallet', 'vestedRewards', 'formattedVestedRewards', 'epoch',
    'vestedUnixTime', 'sentAssetId', 'accrualAssetId', 'result', 'transactionId', 'fromWallet'],
};


