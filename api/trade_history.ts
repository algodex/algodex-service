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
    // ?startkey="object"&endkey="object\u0000"
  
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
  });
  return charts;
}

export const getTradeHistory = async (key:TradeHistoryKey) => {
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
  const history = data.rows.map(row => {
    const retval = row.value;
    retval.low = retval.l.formattedPrice;
    retval.high = retval.h.formattedPrice;
    retval.open = retval.o.formattedPrice;
    retval.close = retval.c.formattedPrice;
    retval.openTime = new Date(retval.o.unixTime).toISOString();
    retval.closeTime = new Date(retval.c.unixTime).toISOString();
    delete retval.o;
    delete retval.h;
    delete retval.l;
    delete retval.c;
  });
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