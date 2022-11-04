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

import { AssetInfo, AssetSummaryInfo, AssetUnitName, getAssetInfo, getSummaryInfo, getUnitNames } from "./asset";
import { AssetTVL, getTVL, getV2Spreads } from "./orders";
import { getDatabase } from "./util";

type WalletOrAsset = 'ownerAddr' | 'assetId';
export type Period = '1d' | '4h' | '1h' | '15m' | '5m' | '1m';
interface TradeHistoryKey {
  keyType: WalletOrAsset,
  searchKey: number | string
}

export interface V1ChartsData {
  current_price: string
  previous_trade_price: string
  last_period_closing_price: string
  asset_info: AssetInfo
  chart_data: V1ChartItem[]
}

export interface V1ChartItem {
  asaVolume: number
  algoVolume: number
  low: string
  formatted_low: string
  high: string
  formatted_high: string
  close: string
  formatted_close: string
  open: string
  formatted_open: string
  dateTime: string
  unixTime: number
  date: string
}

export interface DBChartItem {
  low: number
  high: number
  open: number
  close: number
  startUnixTime: number
}

const getEndKey = (assetId:number, period:Period, cache:V1ChartsData|null|undefined) => {
  if (cache && cache.asset_info && cache.chart_data && cache.chart_data.length > 0) {
    const date = new Date(cache.chart_data[0].unixTime * 1000);
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

    console.log('Due to cache, created key of: ' + timeKey + ' from: ' + cache.chart_data[0].unixTime);
    return [assetId, period, timeKey];
  }
  return [assetId, period, ""];
}

const getChartsData = async (db, startKey, endKey, period, debug):Promise<DBChartItem[]> => {
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

export const mapChartsData = async(assetId:number, chartsData:DBChartItem[]):Promise<V1ChartsData> => {
  const asset_info = await getAssetInfo(assetId);
  const asset_prices = await getAssetPrices(assetId);

  const chart_data:V1ChartItem[] = chartsData.map(item => {
    return {
      asaVolume: 0,
      algoVolume: 0,
      low: item.low + '',
      formatted_low: item.low + '',
      high: item.high + '',
      formatted_high:item.high + '',
      close: item.close + '',
      formatted_close: item.close + '',
      open: item.open + '',
      formatted_open: item.open + '',
      dateTime: '',
      unixTime: item.startUnixTime,
      date: '',
    }
  });

  let current_price = '0';
  let previous_trade_price = '0';
  let last_period_closing_price = '0';

  if (asset_prices?.data?.length > 0) {
    current_price = asset_prices.data[0].price + '';
    previous_trade_price = asset_prices.data[0].priceBefore + '';
    last_period_closing_price = asset_prices.data[0].price * (1-(asset_prices.data[0].price24Change/100)) + ''; //FIXME check for accuracy
  }
  const retdata:V1ChartsData = {
    asset_info,
    chart_data,
    current_price,
    previous_trade_price,
    last_period_closing_price
  };

  return retdata;
}

const getTempCacheHistory = (cache:V1ChartsData|null|undefined):V1ChartItem[] => {
  if (!cache) {
    return [];
  }
  if (!cache.asset_info) {
    return [];
  }
  return cache.chart_data;
};

export const getCharts = async (assetId:number, period:Period, cache:V1ChartsData|null|undefined, debug):Promise<V1ChartsData> => {
  const db = getDatabase('formatted_history');

  const startKey = [assetId, period, "zzzzz"]; // start key is the most recent
  const endKey = getEndKey(assetId, period, cache); // end key is the most historical
  // The sorting is reverse sorting

  const initialChartsData = await getChartsData(db, startKey, endKey, period, debug);
  const charts = await mapChartsData(assetId, initialChartsData);
  
  console.log({startKey});
  console.log({endKey});
  
  console.log('printing newly fetched charts:');
  console.log(JSON.stringify(charts));
  console.log('printing first 5 of cache charts:');

  let tempCachedHistory = getTempCacheHistory(cache);

  console.log(JSON.stringify(tempCachedHistory.slice(0,5)));

  const timeSet:Set<number> = new Set<number>();
  const combinedCharts = [...charts.chart_data, ...tempCachedHistory].filter(item => {
    const hasItem = timeSet.has(item.unixTime);
    timeSet.add(item.unixTime);
    return !hasItem;
  });

  const slicedCharts = combinedCharts.slice(0, 1000);
  return {
    ...charts,
    chart_data: slicedCharts
  }
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

const mapTradeHistory = (dbHistory: DBTradeHistory[], unitNames: any):V1TradeHistory => {
  let historyId = 1;
  const historyItems:V1TradeHistoryItem[] = dbHistory.map(item => {
    return {
      PK_trade_history_id: historyId++,
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
      formattedPrice: (item.algoAmount / item.asaAmount) / (10 ** (item.assetDecimals - 6)) + '',
      formattedASAAmount: item.asaAmount / (10**item.assetDecimals) + '',
    }
  });

  return {
    transactions: historyItems,
    ...unitNames
  };
}

const getUnitNamesFromTradeHistory = async(key:TradeHistoryKey, assetIds:Set<number>) => {
  if (key.keyType !== 'ownerAddr') {
    return [];
  }
  const unitNames = await getUnitNames(assetIds);

  const unitNameData = unitNames.map(entry => ({
    params: {'unit-name': entry.unitName},
    index: entry.assetId
  }));
  return {allAssets: unitNameData};
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

  const assetIds = new Set<number>(history.map(item => item.asaId));
  const unitNames = await getUnitNamesFromTradeHistory(key, assetIds);
  return mapTradeHistory(history, unitNames);
}

export const getChartsFromCache = async (assetId:number, period:Period):Promise<V1ChartsData> => {
  const db = getDatabase('view_cache');
  const key = `trade_history:charts:${assetId}:${period}`;

  try {
    const cachedData = await db.get(key);
    if (!cachedData.cachedData.asset_info) {
      throw {error: 'incorrect_cache_format'};
    }
    return cachedData.cachedData;
  } catch (e) {
    if (e.error === 'not_found' || e.error === 'incorrect_cache_format') {
      return {
        current_price: '',
        previous_trade_price: '',
        last_period_closing_price: '',
        asset_info: undefined,
        chart_data: []
      }
    } else {
      throw e;
    }
  }
}

export const serveChartsNoCache = async (req, res) => {
  const assetId = parseInt(req.params.assetId);
  const period = req.params.period;
  const debug = req.query.debug || false;
  const charts = await getCharts(assetId, period, undefined, debug);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(charts));
  return;
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
    console.error(e);
    res.sendStatus(500);
    res.send(e);
    return;
  }
}

export interface DBAssetPrice {
  lastValue: AssetTimeValue
  yesterdayValue: AssetTimeValue
  dailyChange: number
  assetId: number
}

export interface AssetTimeValue {
  price: number
  unixTime: number
}

export interface V1AllAssetData {
  ok: boolean
  rows: number
  data: V1AssetPriceTimeValue[]
}

export interface V1AssetPriceTimeValue {
  id: number
  unix_time?: number
  price?: number
  priceBefore?: number
  price24Change?: number
  isTraded: boolean
}

const mapAssetPricesToV1 = (assetPrices:DBAssetPrice[], untradedAssets:number[]):V1AllAssetData => {
  const dataRows:V1AssetPriceTimeValue[] = assetPrices.map(assetPrice => {
    return {
      id: assetPrice.assetId,
      unix_time: assetPrice.lastValue?.unixTime,
      price: assetPrice.lastValue?.price,
      priceBefore: assetPrice.yesterdayValue?.price,
      price24Change: assetPrice.dailyChange,
      isTraded: true
    }
  });

  const untradedAssetData = untradedAssets.map(assetId => ({id: assetId, 'isTraded': false}));

  const allAssets = [...dataRows, ...untradedAssetData];

  const retval:V1AllAssetData = {
    ok: true,
    data: allAssets,
    rows: dataRows.length
  }
  return retval;
}

export const getAssetPrices = async (assetId?:number):Promise<V1AllAssetData> => {
  const db = getDatabase('formatted_history');
  
  const data = await db.query('formatted_history/allAssets', {
      reduce: true,
      group: true,
      key: assetId
    });
  const allTradedAssets:DBAssetPrice[] = data.rows.map(row => ({...row.value, assetId: row.key}));

  const tradedAssetsSet = new Set(allTradedAssets.map(item => item.assetId));

  const spreads = await getV2Spreads();
  const untradedAssets = spreads.map(item => item.assetId).filter(assetId => !tradedAssetsSet.has(assetId));

  // TODO: add untraded assets
  return mapAssetPricesToV1(allTradedAssets, untradedAssets);
}

const getAssetPricesFromCache = async() => {
  const db = getDatabase('view_cache');
  const key = 'allPrices';

  const cachedData = await db.get(key);
  return cachedData.cachedData;
}
const filterPrices = (assetIdStr:string, prices) => {
  if (!assetIdStr) {
    return prices;
  }
  const assetId = parseInt(assetIdStr);
  const filteredPrices = prices.data.filter(item => item.id === assetId);
  return {...prices, data:filteredPrices};
}

export const serveCachedAssetPrices = async (req, res) => {
  const assetId = req.params.assetId; // optional parameter
  try {
    const prices = await getAssetPricesFromCache();
    const filteredPrices = filterPrices(assetId, prices);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(filteredPrices));
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

interface V1SearchItem {
  assetName: string
  unitName: string
  verified: boolean
  assetId: number
  isTraded: boolean
  decimals: number
  total: number
  priceChg24Pct: number
  price: string
  formattedPrice: string
  hasOrders: boolean
  formattedASALiquidity: string
  formattedAlgoLiquidity: string
}


const mapSearchAllData = (assetSet:Set<number>, prices:V1AllAssetData,
    tvl:AssetTVL[], assetSummaryInfo:AssetSummaryInfo[]):V1SearchItem[] => {
  
  const assetIdToPrice = prices.data.reduce((map, priceItem) => {
    map.set(priceItem.id, priceItem);
    return map;
  }, new Map<number, V1AssetPriceTimeValue>);

  const assetIdToTVL = tvl.reduce((map, tvlItem) => {
    map.set(tvlItem.assetId, tvlItem);
    return map;
  }, new Map<number, AssetTVL>);

  const assetIdToSummaryInfo = assetSummaryInfo.reduce((map, assetItem) => {
    map.set(assetItem.assetId, assetItem);
    return map;
  }, new Map<number, AssetSummaryInfo>);

  const searchResults:V1SearchItem[] = Array.from(assetSet).map(assetId => {
    const assetName = assetIdToSummaryInfo.get(assetId).name;
    const unitName = assetIdToSummaryInfo.get(assetId).unitName;
    const isTraded = assetIdToPrice.get(assetId)?.isTraded ? true : false;
    const decimals = assetIdToSummaryInfo.get(assetId).decimals;
    const verified = assetIdToSummaryInfo.get(assetId).verified;
    const total = assetIdToSummaryInfo.get(assetId).total;
    const price24Change = assetIdToPrice.get(assetId)?.price24Change || 0;
    const hasOrders = assetIdToTVL.has(assetId) && 
      (assetIdToTVL.get(assetId).formattedAlgoTVL > 0 || assetIdToTVL.get(assetId).formattedAssetTVL > 0);
    
    const formattedASALiquidity = (assetIdToTVL.get(assetId)?.formattedAssetTVL || 0) + '';
    const formattedAlgoLiquidity = (assetIdToTVL.get(assetId)?.formattedAlgoTVL || 0) + '';
    const formattedPrice = (assetIdToPrice.get(assetId)?.price || 0) + '';
    const price = (assetIdToPrice.get(assetId)?.price || 0) * (Math.pow(10, 6 - decimals)) + '';

    return {
      assetId,
      assetName,
      unitName,
      isTraded,
      decimals,
      verified,
      priceChg24Pct: price24Change,
      total,
      hasOrders,
      formattedASALiquidity,
      formattedAlgoLiquidity,
      formattedPrice,
      price
    }
  });

  return searchResults;

}

export const serveSearchAll = async (req, res) => {
  const prices:V1AllAssetData = await getAssetPricesFromCache();
  const tvl = await getTVL();
  const assetSet1:Set<number> = new Set(prices.data.map(price => price.id));
  const assetSet2:Set<number> = new Set(tvl.map(asset => asset.assetId));
  const assetSet:Set<number> = new Set([...assetSet1, ...assetSet2]);

  const assetSummaryInfo = await getSummaryInfo(assetSet);
  
  const searchData = mapSearchAllData(assetSet, prices, tvl, assetSummaryInfo);

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(searchData));
}

export const serveSearch = async (req, res) => {
  const searchQuery = req.query.searchStr || '';
  if (searchQuery.length === 0) {
    return serveSearchAll(req,res);
  }
}

export const serveAllAssetPrices = async (req, res) => {  
  const prices = await getAssetPrices();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(prices));
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