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
    _id: {type: 'string'},
    _rev: {type: 'string'},
    tradeType: {type: 'string'},
    executeType: {type: 'string'},
    escrowAddr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    groupId: {type: 'string'},
    algoAmount: {type: 'integer'},
    assetSellerAddr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    asaAmount: {type: 'integer'},
    asaId: {type: 'integer'},
    assetBuyerAddr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    block: {type: 'integer'},
    unixTime: {type: 'integer'},
    assetDecimals: {type: 'integer'},
  },
  required: ['_id', 'tradeType', 'executeType', 'escrowAddr', 'groupId',
    'algoAmount', 'assetSellerAddr', 'asaAmount', 'asaId', 'assetBuyerAddr',
    'block', 'unixTime', 'assetDecimals'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
