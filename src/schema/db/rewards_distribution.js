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

const _ = require('lodash');

const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    to_wallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    amount: {type: 'integer'},
    assetId: {type: 'integer'},
    epoch: {type: 'integer'},
    network: {type: 'string'},
    accrualNetwork: {type: 'string'},
    unix_time: {type: 'integer'},
    result: {type: 'string'},
    from_wallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    error: {type: 'string'},
  },
  required: ['_id', 'to_wallet', 'amount', 'result',
    'assetId', 'epoch', 'network', 'unix_time', 'accrualNetwork',
    'from_wallet'],
};

module.exports = () => {
  return {...schema};
};
