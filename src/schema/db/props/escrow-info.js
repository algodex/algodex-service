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

// "escrowInfo": {
//   "isAlgoBuyEscrow": true,
//   "type": "open",
//   "orderInfo": "10-15-0-15322902",
//   "numerator": 10,
//   "assetId": 15322902,
//   "denominator": 15,
//   "minimum": 0,
//   "price": 1.5,
//   "ownerAddr": "YMIHGTLM72XH434HHI3BAQLXTGC6CKG2XVCU3F2ARIDFCNNYUIB5SJ3K4E",
//   "block": "16583614",
//   "ts": 1631353290,
//   "version": "\u0003",
//   "status": "open"
// },

const schema = {
  type: 'object',
  properties: {
    isAlgoBuyEscrow: {type: 'boolean'},
    apat: {type: 'array'},
    type: {type: 'string'},
    orderInfo: {type: 'string'},
    numerator: {type: 'integer'},
    assetId: {type: 'integer'},
    denominator: {type: 'integer'},
    minimum: {type: 'integer'},
    price: {type: 'number'},
    ownerAddr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    block: {type: 'string', pattern: '^[0-9]+$'},
    ts: {type: 'integer'},
    version: {type: ['string', 'null']},
    status: {type: 'string'},
  },
  required: ['isAlgoBuyEscrow', 'type', 'orderInfo', 'numerator',
    'assetId', 'denominator', 'minimum', 'price', 'ownerAddr',
    'block', 'ts', 'version', 'status'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
