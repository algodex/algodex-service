#!/usr/bin/env node

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

/* eslint-disable require-jsdoc */
require('dotenv').config();
const getDatabases = require('../src/db/get-databases');
const databases = getDatabases('testnet_');
const fs = require('fs');

const formattedEscrowDB = databases.formatted_escrow;
const formattedHistoryDB = databases.formatted_history;

const getWalletToDates = (rows, dateType) => {
  const walletToDates = rows.filter(row =>
    row.key !== undefined && row.value !== undefined)
      .filter(row => {
        const type = row.key.split(':')[1];
        return type === dateType;
      }).reduce((map, row) => {
        const wallet = row.key.split(':')[0];
        if (map[wallet] === undefined) {
          map[wallet] = new Set();
        }
        map[wallet].add(row.value);
        return map;
      }, {});
  return walletToDates;
};

async function run() {
  const escrowDates =
    await formattedEscrowDB.query('formatted_escrow/distinctDates',
        {reduce: false} );

  const historyDates =
      await formattedHistoryDB.query('formatted_history/distinctDates',
          {reduce: false} );

  const tradeData =
    await formattedHistoryDB.query('formatted_history/activityView',
        {reduce: true, group: true} );

  const orderCountData =
    await formattedEscrowDB.query('formatted_escrow/openOrderCount',
        {reduce: true, group: true} );

  const accountData = {rows: [...escrowDates.rows, ...historyDates.rows]};

  const walletToOrderCount = orderCountData.rows.reduce((map, row) => {
    const wallet = row.key;
    map[wallet] = row.value;
    return map;
  }, {});

  const walletToTradeData = tradeData.rows.reduce((map, row) => {
    const wallet = row.key;
    map[wallet] = row.value;
    return map;
  }, {});
  const walletToMonths = getWalletToDates(accountData.rows, 'month');
  const walletToDates = getWalletToDates(accountData.rows, 'date');
  const walletToInfo = {};

  // Object.keys(walletToDates).reduce( (map, wallet) => {
  //   const dateCount = walletToDates[wallet].size;
  //   const info = { dateCount };
  //   map[wallet] = info;
  //   return map;
  // }, {});

  const setData = (walletMap, walletToInfo, key) => {
    Object.keys(walletMap).forEach(wallet => {
      const val = walletMap[wallet].size || walletMap[wallet];
      if (walletToInfo[wallet] === undefined) {
        walletToInfo[wallet] = {};
      }
      walletToInfo[wallet][key] = val;
    });
  };
  setData(walletToMonths, walletToInfo, 'monthCount');
  setData(walletToDates, walletToInfo, 'dateCount');
  setData(walletToTradeData, walletToInfo, 'tradeCount');
  setData(walletToOrderCount, walletToInfo, 'orderCount');

  // Object.keys(walletToMonths).forEach(wallet => {
  //   const monthCount = walletToMonths[wallet].size;
  //   if (walletToInfo[wallet] === undefined) {
  //     walletToInfo[wallet] = {};
  //   }
  //   walletToInfo[wallet].monthCount = monthCount;
  // });
  // Object.keys(walletToTradeData).forEach(wallet => {
  //   const tradeCount = walletToTradeData[wallet];
  //   if (walletToInfo[wallet] === undefined) {
  //     walletToInfo[wallet] = {};
  //   }
  //   walletToInfo[wallet].tradeCount = tradeCount;
  // });
  // Object.keys(walletToOrderCount).forEach(wallet => {
  //   const orderCount = walletToOrderCount[wallet];
  //   if (walletToInfo[wallet] === undefined) {
  //     walletToInfo[wallet] = {};
  //   }
  //   walletToInfo[wallet].orderCount = orderCount;
  // });


  const wallets = Object.keys(walletToInfo).filter(wallet => {
    const entry = walletToInfo[wallet];
    const tradeCount = entry.tradeCount || 0;
    const orderCount = entry.orderCount || 0;
    const dateCount = entry.dateCount || 0;
    const monthCount = entry.monthCount || 0;
    return orderCount >= 5 && tradeCount >=10 &&
      monthCount >= 2 && dateCount >= 5;
  });

  const stream = fs.createWriteStream('12000_algx_rewards_testnet_wallets.txt');
  stream.once('open', function(fd) {
    wallets.forEach(wallet => stream.write(wallet+'\n'));
    stream.end();
  });

  const goodWalletSet = wallets.reduce( (set, wallet) => {
    set.add(wallet);
    return set;
  }, new Set());


  // walletsLowerElig.forEach(wallet => {
  //   goodWalletSet.add(wallet);
  // });

  const walletsThirdElig = Object.keys(walletToInfo).filter(wallet => {
    if (goodWalletSet.has(wallet)) {
      return false;
    }
    const entry = walletToInfo[wallet];
    const tradeCount = entry.tradeCount || 0;
    const orderCount = entry.orderCount || 0;
    const dateCount = entry.dateCount || 0;
    return (orderCount + tradeCount >=20) && dateCount >= 10;
  });

  walletsThirdElig.forEach(wallet => {
    goodWalletSet.add(wallet);
  });

  const stream3 = fs.createWriteStream('8500_algx_rewards_testnet_wallets.txt');
  stream3.once('open', function(fd) {
    walletsThirdElig.forEach(wallet => stream3.write(wallet+'\n'));
    stream3.end();
  });

  const walletsLowerElig = Object.keys(walletToInfo).filter(wallet => {
    if (goodWalletSet.has(wallet)) {
      return false;
    }
    const entry = walletToInfo[wallet];
    const tradeCount = entry.tradeCount || 0;
    const orderCount = entry.orderCount || 0;
    const dateCount = entry.dateCount || 0;
    return orderCount >= 5 && tradeCount >=10 && dateCount >= 2;
  });

  const stream2 = fs.createWriteStream('3000_algx_rewards_testnet_wallets.txt');
  stream2.once('open', function(fd) {
    walletsLowerElig.forEach(wallet => stream2.write(wallet+'\n'));
    stream2.end();
  });
}

run();
