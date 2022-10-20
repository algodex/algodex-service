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

import { getDatabase } from "./util";

type WalletOrAsset = 'ownerAddr' | 'assetId';
export type Period = '1d' | '4h' | '1h' | '15m' | '5m' | '1m';
interface TradeHistoryKey {
  keyType: WalletOrAsset,
  searchKey: number | string
}

const getEndKey = (assetId:number, period:Period, cache) => {
  if (cache && cache.length > 0) {
    const date = new Date(cache[0].startUnixTime * 1000);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    const day = `${date.getUTCDate()}`.padStart(2, '0'); ;
  
    const YMD = `${year}-${month}-${day}`;

    const hour = `${date.getHours()}`.padStart(2, '0');
    const min = `${date.getMinutes()}`.padStart(2, '0');
    const min5 = `${Math.floor(date.getMinutes() / 5)*5}`.padStart(2, '0');
    const min15 = `${Math.floor(date.getMinutes() / 15)*15}`.padStart(2, '0');
    const hour4 = `${Math.floor(date.getHours() / 4)*4}`.padStart(2, '0');
  
    let timeKey = null;

    if (period === '1h') {
      timeKey = `${YMD}:${hour}:00`;
    } else if (period === '1d') {
      timeKey = `${YMD}:00:00`;
    } else if (period === '1m') {
      timeKey = `${YMD}:${hour}:${min}`;
    } else if (period === '5m') {
      timeKey = `${YMD}:${hour}:${min5}`;
    } else if (period === '15m') {
      timeKey = `${YMD}:${hour}:${min15}`;
    } else if (period === '4h') {
      timeKey = `${YMD}:${hour4}:00`;
    }

    console.log('Due to cache, created key of: ' + timeKey + ' from: ' + cache[0].startUnixTime);
    return [assetId, period, timeKey];
  }
  return [assetId, period, ""];
}

const getChartsData = async (db, startKey, endKey, period, debug) => {
  const data = await db.query('formatted_history/charts', {
    startkey: startKey,
    endkey: endKey,
    limit: 5000,
    descending: true,
    reduce: true,
    group: true
  });
  const charts = data.rows.map(row => {
    const value = row.value;
    if (debug) {
      Object.keys(value).forEach(key => {
        const unixTime = value[key].unixTime;
        const date = new Date(unixTime);
        value[key].utcTime = date.toISOString();
      });
    }
    return row.value;
  }).map(row => {
    const retval = row;
    retval.low = retval.l.formattedPrice;
    retval.high = retval.h.formattedPrice;
    retval.open = retval.o.formattedPrice;
    retval.close = retval.c.formattedPrice;

    const timeStart = retval.o.unixTime;

    const date = new Date(timeStart);
    // The padding is needed for sorting the view
    const month = date.getMonth();
    const year = date.getFullYear();
    const day = date.getUTCDate();

    const hour = date.getHours();

    const min = date.getMinutes();
    const min5 = Math.floor(min / 5) * 5;
    const min15 = Math.floor(min / 15) * 15;
    const hour4 = Math.floor(hour / 4) * 4;

    let startMinute;
    let startHour;
    if (period === '15m') {
      startMinute = min15;
    } else if (period === '5m') {
      startMinute = min5;
    } else if (period === '1m') {
      startMinute = min;
    } else {
      startMinute = 0;
    }

    if (period === '1h' || period === '15m' || 
      period === '5m' || period === '1m') {
        startHour = hour;
    } else if (period === '4h') {
      startHour = hour4;
    } else {
      startHour = 0;
    }

    const startDate = new Date(year, month, day, startHour, startMinute, 0);
    retval.startUnixTime = Math.floor(startDate.getTime() / 1000);
    delete retval.o;
    delete retval.h;
    delete retval.l;
    delete retval.c;
    return retval;
  });
  return charts;
}

export const getCharts = async (assetId:number, period:Period, cache, debug) => {
  const db = getDatabase('formatted_history');

  const startKey = [assetId, period, "zzzzz"]; // start key is the most recent
  const endKey = getEndKey(assetId, period, cache); // end key is the most historical
  // The sorting is reverse sorting

  const charts = await getChartsData(db, startKey, endKey, period, debug);

  console.log({startKey});
  console.log({endKey});
  
  console.log('printing newly fetched charts:');
  console.log(JSON.stringify(charts));
  console.log('printing first 5 of cache charts:');

  const tempCache = cache || [];

  console.log(JSON.stringify(tempCache.slice(0,5)));

  const timeSet:Set<number> = new Set<number>();
  const combinedCharts = [...charts, ...tempCache].filter(item => {
    const hasItem = timeSet.has(item.startUnixTime);
    timeSet.add(item.startUnixTime);
    return !hasItem;
  });

  return combinedCharts.slice(0, 1000); // Return up to 1000 items
}

interface V1TradeHistory {
  transactions:V1TradeHistoryItem[]
}
interface V1TradeHistoryItem {
  PK_trade_history_id: number
  transaction_id: any
  group_id: string
  unix_time: number
  block_round: number
  application_id: number
  asset_id: number
  asaPrice: string
  algoAmount: number
  asaAmount: number
  asaBuyerAddress: string
  asaSellerAddress: string
  tradeType: string
  formattedPrice: string
  formattedASAAmount: string
}

interface DBTradeHistory {
  tradeType: string
  executeType: string
  escrowAddr: string
  groupId: string
  algoAmount: number
  assetSellerAddr: string
  asaAmount: number
  asaId: number
  assetBuyerAddr: string
  block: number
  unixTime: number
  assetDecimals: number
}

const mapTradeHistory = (dbHistory: DBTradeHistory[]):V1TradeHistory => {
  const historyItems:V1TradeHistoryItem[] = dbHistory.map(item => {
    return {
      PK_trade_history_id: -1,
      transaction_id: '',
      group_id: item.groupId,
      unix_time: item.unixTime,
      block_round: item.block,
      application_id: item.tradeType === 'buy' ? parseInt(process.env.ALGODEX_ALGO_ESCROW_APP) : parseInt(process.env.ALGODEX_ASA_ESCROW_APP),
      asset_id: item.asaId,
      asaPrice: (item.algoAmount / item.asaAmount) + '',
      algoAmount: item.algoAmount,
      asaAmount: item.asaAmount,
      asaBuyerAddress: item.assetBuyerAddr,
      asaSellerAddress: item.assetSellerAddr,
      tradeType: item.tradeType === 'buy' ? 'buyASA' : 'sellASA',
      formattedPrice: (item.algoAmount / item.asaAmount) / (10**item.assetDecimals) + '',
      formattedASAAmount: item.asaAmount / (10**item.assetDecimals) + '',
    }
  });

  return {
    transactions: historyItems
  };
}

const getTradeHistory = async (key:TradeHistoryKey) => {
  const db = getDatabase('formatted_history');
  const {keyType, searchKey} = key;
  const startKey = [keyType, searchKey, 1e30];
  const endKey = [keyType, searchKey, 0];
  
  const data = await db.query('formatted_history/activityView', {
      startkey: startKey,
      endkey: endKey,
      limit: 500,
      descending: true,
      reduce: false
    });
  const history = data.rows.map(row => row.value);
  return mapTradeHistory(history);
}

export const getChartsFromCache = async (assetId:number, period:Period) => {
  const db = getDatabase('view_cache');
  const key = `trade_history:charts:${assetId}:${period}`;

  const cachedData = await db.get(key);
  return cachedData.cachedData;
}

export const serveCharts = async (req, res) => {
  const assetId = parseInt(req.params.assetId);
  const period = req.params.period;
  const debug = req.query.debug || false;
  try {
    const charts = await getChartsFromCache(assetId, period);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(charts));
    return;
  } catch (e) {
    if (e.error === 'not_found') {
      console.error(e);
      res.sendStatus(404);
      return;
    } else {
      console.error(e);
      res.sendStatus(500);
      res.send(e);
      return;
    }
  }
}

export const getAllAssetPrices = async () => {
  const db = getDatabase('formatted_history');
  
  const data = await db.query('formatted_history/allAssets', {
      reduce: true,
      group: true
    });
  const allAssets = data.rows.map(row => row.value);
  return allAssets;
}


export const serveAllAssetPrices = async (req, res) => {  
  const history = await getAllAssetPrices();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(history));
}

export const serveTradeHistoryByAssetId = async (req, res) => {
  const assetId = parseInt(req.params.assetId);
  
  const history = await getTradeHistory({keyType:'assetId', searchKey:assetId});
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(history));
}

export const serveTradeHistoryByOwner = async (req, res) => {
  const ownerAddr = req.params.ownerAddress;
  
  const history = await getTradeHistory({keyType:'ownerAddr', searchKey:ownerAddr});
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(history));
}