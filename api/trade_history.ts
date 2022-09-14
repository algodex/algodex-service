import { getDatabase } from "./util";

type WalletOrAsset = 'ownerAddr' | 'assetId';

interface TradeHistoryKey {
  keyType: WalletOrAsset,
  searchKey: number | string
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
  const history = data.rows.map(row => row.value);
  return history;
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