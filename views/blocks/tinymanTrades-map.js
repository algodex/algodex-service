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

module.exports = function(doc) {
  const groupsWithUsdcTrade = doc.txns
      .map(txn => txn.txn)
      .filter(txn => txn.apid === '<TINYMAN_APP>')
      .filter(txn => {
        return true;
      })
      .filter(txn => txn.grp !== undefined)
      .reduce((obj, txn) => {
        const grp = txn.grp;
        obj[grp] = 1;
        return obj;
      }, {});

  const allGroups = doc.txns
      .filter(txn => groupsWithUsdcTrade.hasOwnProperty(txn.txn.grp))
      .reduce((allGroups, txn) => {
        const txnGroup = txn.txn.grp;
        if (txnGroup === undefined) {
          return allGroups;
        }

        const groupTxnArr = (allGroups[txnGroup] || []);
        groupTxnArr.push(txn);
        allGroups[txnGroup] = groupTxnArr;
        return allGroups;
      }, {});

  Object.values(allGroups).forEach(group => {
    if (group.length !== 4) {
      return;
    }
    const poolXferAmount = group[3].txn.amt || group[3].txn.aamt;
    const userXferAmount = group[2].txn.amt || group[2].txn.aamt;
    const poolXferType = group[3].txn.type;
    const userXferType = group[2].txn.type;
    const poolXferAssetId = group[3].txn.xaid || 1;
    const userXferAssetId = group[2].txn.xaid || 1;
    if (((poolXferType === 'pay' && userXferType === 'axfer') ||
    (poolXferType === 'axfer' && userXferType === 'pay')) &&
    poolXferAmount && userXferAmount) {
      const asset1 = Math.min(poolXferAssetId, userXferAssetId);
      const asset2 = Math.max(poolXferAssetId, userXferAssetId);
      emit([asset1, asset2, doc.ts], {round: doc.rnd, poolXferAssetId,
        userXferAssetId,
        unix_time: doc.ts, poolXferType, poolXferAmount,
        userXferAmount, userXferType});
    }
  });
};
