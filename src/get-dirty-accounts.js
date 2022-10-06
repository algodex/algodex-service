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

module.exports = block => {
  // console.log( {block} );
  if (block.txns === undefined) {
    return [];
  }
  const txnTypes = ['snd', 'rcv', 'close', 'asnd', 'arcv', 'aclose', 'fadd'];
  const dirtyAccounts = block.txns.reduce( (accounts, txn) => {
    txnTypes.forEach( type => {
      if (txn.txn !== undefined && txn.txn[type] !== undefined) {
        const account = txn.txn[type];
        accounts[account] = 1;
      }
    });
    return accounts;
  }, {});
  return Object.keys(dirtyAccounts);
};

