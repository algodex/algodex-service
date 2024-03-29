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
    verified: {type: 'boolean'},
    lastVerified: {type: 'integer'},
    asset: {
      type: 'object',
      properties: {
        index: {type: 'integer'},
        params: {
          properties: {
            decimals: {type: 'integer'},
          },
          type: 'object',
          required: ['decimals'],
        },
      },
      required: ['index', 'params'],
    },
  },
  required: ['_id', 'asset', 'lastVerified', 'verified'],
};

module.exports = () => {
  return {...schema};
};
