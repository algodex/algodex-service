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


export interface Rewards {
  _id: string,
  _rev?: string,
  ownerWallet: string,
  uptime: number,
  depthSum: number,
  qualitySum: number,
  algxAvg: number,
  qualityFinal: number,
  epoch: number,
  accrualAssetId: number,
  rewardsAssetId: number,
  earnedRewards: number,
  earnedRewardsFormatted: number
}
const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    ownerWallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    uptime: {type: 'integer', minimum: 0},
    depthSum: {type: 'number', minimum: 0},
    depthRatio: {type: 'number', minimum: 0},    
    qualitySum: {type: 'number', minimum: 0},
    algxAvg: {type: 'number', minimum: 0},
    qualityFinal: {type: 'number', minimum: 0},
    earnedRewards: {type: 'integer', minimum: 0}, // FIXME - update the script that stores this!
    earnedRewardsFormatted: {type: 'number', minimum: 0},
    epoch: {type: 'integer', minimum: 0},
    accrualAssetId: {type: 'integer', minimum: 0},
    rewardsAssetId: {type: 'integer', minimum: 0},
    algoTotalDepth: {type: 'number', minimum: 0},
    asaTotalDepth: {type: 'number', minimum: 0},
    updatedAt: {type: 'string'},
  },
  required: ['_id', 'ownerWallet', 'uptime', 'depthSum', 'accrualAssetId', 'rewardsAssetId',
    'qualitySum', 'algxAvg', 'qualityFinal', 'earnedRewardsFormatted', 'epoch', 'updatedAt',
    'algoTotalDepth', 'asaTotalDepth'
   ],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
