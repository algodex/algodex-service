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


let indexerClient = null;

module.exports = () => {
  if (indexerClient !== null) {
    return indexerClient;
  }
  const algosdk = require('algosdk');
  const baseServer = process.env.ALGORAND_INDEXER_SERVER;

  if (!baseServer) {
    throw new Error('ALGORAND_INDEXER_SERVER is not set!');
  }
  const port = process.env.ALGORAND_INDEXER_PORT || '';

  const token = process.env.ALGORAND_INDEXER_TOKEN || '';

  indexerClient = new algosdk.Indexer(token, baseServer, port);
  return indexerClient;
};
