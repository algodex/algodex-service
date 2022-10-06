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

const hasAlgxChanges = block => {
  if (!block.txns) {
    return false;
  }
  const algxAssetId = process.env.ALGX_ASSET_ID;
  if (algxAssetId === undefined) {
    throw new Error('process.env.ALGX_ASSET_ID is not defined!');
  }

  const algxTransfer = block.txns
      .flatMap(txn => {
        if (txn?.dt?.itx) {
          return txn.dt.itx;
        }
        return txn;
      })
      .map(txn => txn.txn)
      .filter(txn => txn.type === 'axfer')
      .filter(txn => txn.xaid === parseInt(algxAssetId))
      .find(txn => (txn.aamt && txn.aamt > 0) || txn.aclose !== undefined);

  if (!algxTransfer) {
    return false;
  }
  return true;
};

module.exports = hasAlgxChanges;
