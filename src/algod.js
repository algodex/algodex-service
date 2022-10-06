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

const algosdk = require('algosdk');
let client;

module.exports = function getAlgod() {
  if (typeof process.env.ALGORAND_ALGOD_SERVER === 'undefined') {
    throw new Error('Invalid Algod server!');
  }
  if (typeof client === 'undefined') {
    client = new algosdk.Algodv2(
        process.env.ALGORAND_TOKEN,
        process.env.ALGORAND_ALGOD_SERVER,
        process.env.ALGORAND_ALGOD_PORT,
    );
  }
  return client;
};
