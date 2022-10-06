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
    data: {
      type: 'object',
      properties: {
        indexerInfo: {...require('./indexed_escrow')()},
        escrowInfo: {...require('./props/escrow-info')()},
        lastUpdateUnixTime: {type: 'integer'},
        lastUpdateRound: {type: 'integer'},
        assetDecimals: {type: 'integer'},
        history: {type: 'array', minItems: 1, uniqueItems: true,
          items: {
            type: 'object',
            properties: {
              algoAmount: {type: 'integer'},
              asaAmount: {type: 'integer'},
              time: {type: 'integer'},
              round: {type: 'integer'},
            },
            oneOf: [
              {required: ['time', 'round', 'algoAmount']},
              {required: ['time', 'round', 'asaAmount']},
            ],
          },
        },

      },
      required: ['indexerInfo', 'escrowInfo', 'lastUpdateUnixTime',
        'lastUpdateRound', 'assetDecimals', 'history'],
    },
  },
  required: ['_id', 'data'],
};

module.exports = () => {
  const retSchema = _.cloneDeep(schema);
  // Don't allow null values
  retSchema.properties.data
      .properties.escrowInfo.properties.version.type = 'string';
  return retSchema;
};
