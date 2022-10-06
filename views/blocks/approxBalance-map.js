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
  const getDidCloseSet = (txns, txnType) => {
    const didCloseSet = txns.reduce( (didCloseSet, txn) => {
      if (txn.txn !== undefined && txn.txn[txnType] !== undefined) {
        didCloseSet[txn.txn.snd] = 1;
      }
      return didCloseSet;
    }, {});

    return didCloseSet;
  };
  // Map Function
  if (typeof doc.txns !== 'undefined') {
    const accountDidCloseAssetSet = getDidCloseSet(doc.txns, 'aclose');
    const accountDidCloseAlgoSet = getDidCloseSet(doc.txns, 'close');
    const accountToTxns = doc.txns.reduce( (accountToTxns, txn) => {
      const txnTypes = ['snd', 'rcv', 'close', 'asnd', 'arcv', 'aclose',
        'fadd'];
      for (let i = 0; i < txnTypes.length; i++) {
        const type = txnTypes[i];
        if (txn.txn !== undefined && txn.txn[type] !== undefined) {
          const account = txn.txn[type];
          const accountTxnArr = accountToTxns[account] || [];
          accountToTxns[account] = accountTxnArr;
          accountTxnArr.push(txn);
        }
      }
      return accountToTxns;
    }, {});
    for (const [account, txns] of Object.entries(accountToTxns)) {
    //   const posTypes = ['rcv', 'arcv'];
    //   const negTypes = ['snd', 'asnd'];
      const diff = txns.reduce( (diff, txn) => {
        let algoDiff = diff.algoDiff || 0;
        let asaDiff = diff.asaDiff || 0;
        if (txn.txn.rcv === account) {
          algoDiff += (txn.txn.amt || 0);
        }
        if (txn.txn.snd === account) {
          // Most types of transfers
          algoDiff -= (txn.txn.amt || 0);
          algoDiff -= (txn.txn.fee || 0);
          asaDiff -= (txn.txn.aamt || 0);
        } else if (txn.txn.asnd === account) {
          // Clawback transaction
          asaDiff -= (txn.txn.aamt || 0);
        }
        if (txn.txn.arcv === account) {
          asaDiff += (txn.txn.aamt || 0);
        }
        const didCloseAsset = diff.didCloseAsset ||
            (account in accountDidCloseAssetSet);
        const didCloseAccount = diff.didCloseAccount ||
            (account in accountDidCloseAlgoSet);
        return {algoDiff, asaDiff, didCloseAsset, didCloseAccount};
      }, {});
      diff.block = parseInt(doc._id);
      emit([account, parseInt(doc._id)], diff);
    }
  }
};

// reducer: none
