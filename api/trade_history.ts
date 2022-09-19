import { getDatabase } from "./util";

type WalletOrAsset = 'ownerAddr' | 'assetId';
export type Period = '1d' | '4h' | '1h' | '15m' | '5m' | '1m';
interface TradeHistoryKey {
  keyType: WalletOrAsset,
  searchKey: number | string
}

export const getCharts = async (assetId:number, period:Period, debug=false) => {
  const db = getDatabase('formatted_history');
  const startKey = [assetId, period, "zzzzz"];
  const endKey = [assetId, period, ""];
  
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
    const min5 = min % 5;
    const min15 = min % 15;
    const hour4 = hour % 4;

    let startMinute;
    let startHour;
    if (period === '15m') {
      startMinute = min15 * 15;
    } else if (period === '5m') {
      startMinute = min5 * 5;
    } else if (period === '1m') {
      startMinute = min;
    } else {
      startMinute = 0;
    }

    if (period === '1h' || period === '15m' || 
      period === '5m' || period === '1m') {
        startHour = hour;
    } else if (period === '4h') {
      startHour = hour * 4;
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
  return history;
}

export const serveCharts = async (req, res) => {
  const assetId = parseInt(req.params.assetId);
  const period = req.params.period;
  const debug = req.query.debug || false;
  
  const charts = await getCharts(assetId, period, debug);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(charts));
}

const getAllAssetPrices = async () => {
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
  res.end(JSON.stringify(history));
}

export const serveTradeHistoryByAssetId = async (req, res) => {
  const assetId = parseInt(req.params.assetId);
  
  const history = await getTradeHistory({keyType:'assetId', searchKey:assetId});
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(history));
}

export const serveTradeHistoryByOwner = async (req, res) => {
  const ownerAddr = req.params.ownerAddress;
  
  const history = await getTradeHistory({keyType:'ownerAddr', searchKey:ownerAddr});
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(history));
}