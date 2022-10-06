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
    _id: {type: 'string', pattern: '^[0-9]+$'},
    _rev: {type: 'string'},
    rnd: {type: 'integer'},
    tc: {type: 'integer'},
    ts: {type: 'integer'},
    txns: {type: 'array', uniqueItems: true,
      items: {
        type: 'object',
        properties: {
          hgi: {type: 'boolean'},
          sig: {type: 'string'},
          txn: {
            type: 'object',
            properties: {
              amt: {type: 'integer'},
              aamt: {type: 'integer'},
              fee: {type: 'integer'},
              note: {type: 'string'},
              rcv: {type: 'string'},
              snd: {type: 'string'},
              arcv: {type: 'string'},
              // More properties possible here
            },
          },
        },
        required: ['txn'],
      },
    },
  },
  required: ['_id', 'rnd', 'tc', 'ts'],
  additionalProperties: true,
};

module.exports = () => {
  return {...schema};
};
