const axios = require('axios').default;
import { getOpenOrders } from "./orders";
import { getDatabase } from "./util";

const initOrGetIndexer = require('../src/get-indexer');
/*
        {
            "assetId": 724480511,
            "amount": 4375026530843,
            "asaInOrder": 61411686891,
            "name": "Algodex Token",
            "unit_name": "ALGX",
            "decimals": 6,
            "asaPrice": "0.004730443942",
            "formattedTotalASAAmount": "4375026.530843",
            "formattedASAInOrder": "61411.686891",
            "formattedASAAvailable": "4313614.843952",
            "formattedPrice": "0.004730",
            "formattedTotalAlgoEquiv": "20693.875491"
        },
*/
interface WalletAsset {
    "assetId": number,
    "amount": number,
    "asaInOrder": number,
    "name": string,
    "unit_name": string,
    "decimals": number,
    "asaPrice": string,
    "formattedTotalASAAmount": string,
    "formattedASAInOrder": string,
    "formattedASAAvailable": string,
    "formattedPrice": string,
    "formattedTotalAlgoEquiv": string
}

export interface IndexerAssetResult {
  assets?: Asset[]
  "current-round": number
  "next-token": string
}

export interface Asset {
  amount: number
  "asset-id": number
  deleted: boolean
  "is-frozen": boolean
  "opted-in-at-round": number
}

export interface FullAssetInfo {
  _id: string
  _rev: string
  type: string
  asset: Asset
  "current-round": number
}

export interface Asset {
  "created-at-round": number
  deleted: boolean
  index: number
  params: Params
}

export interface Params {
  clawback: string
  creator: string
  decimals: number
  "default-frozen": boolean
  freeze: string
  manager: string
  name: string
  "name-b64": string
  reserve: string
  total: number
  "unit-name": string
  "unit-name-b64": string
}




const getWalletAssets = async (walletAddr:string):Promise<WalletAsset[]> => {
  const db = getDatabase('assets');
  const indexer = initOrGetIndexer();
  const accountAssets:IndexerAssetResult = await indexer.lookupAccountAssets(walletAddr).do();

  if (!accountAssets.assets) {
    return [];
  }

  const walletAssetIdToAmount = accountAssets.assets.reduce((map, asset) => {
    const assetId = asset["asset-id"];
    const amount = asset.amount;
    map.set(assetId, amount);
    return map;
  }, new Map<number, number>);

  const assetIds = accountAssets.assets.map(asset => ''+asset["asset-id"]);

  // console.log(JSON.stringify(accountAssets));
  const data = await db.query('assets/assets', {
    keys: assetIds
  });

  const fullAssetInfo:Array<FullAssetInfo> = data.rows.map(entry => entry.value);

  const orders = await getOpenOrders(walletAddr);
  const assetToAmountInOrder:Map<number,number> = orders.reduce((map, order) => {
    let amountSum = map.get(order.assetId) || 0;
    amountSum += order.asaAmount || 0;
    map.set(order.assetId, amountSum);
    return map;
  }, new Map());

  // FIXME - need to set prices
  return fullAssetInfo.map(asset => {
    const assetId = asset.asset.index;
    const walletAssetAmount = walletAssetIdToAmount.get(assetId);
    const formattedASAAvailable = walletAssetAmount / 10**asset.asset.params.decimals;
    const asaInOrder = assetToAmountInOrder.get(assetId) || 0;
    const formattedASAInOrder = asaInOrder / 10**asset.asset.params.decimals;
    const amount = asaInOrder + walletAssetAmount;
    const formattedTotalASAAmount = formattedASAInOrder + formattedASAAvailable;
    const walletAsset:WalletAsset = {
      "assetId": asset.asset["asset-id"],
      "amount": amount,
      "asaInOrder": asaInOrder,
      "name": asset.asset.params.name,
      "unit_name": asset.asset.params["unit-name"],
      "decimals": asset.asset.params.decimals,
      "asaPrice": "0",
      "formattedTotalASAAmount": formattedTotalASAAmount + '',
      "formattedASAInOrder": formattedASAInOrder + '',
      "formattedASAAvailable": formattedASAAvailable + '',
      "formattedPrice": "0",
      "formattedTotalAlgoEquiv": "0"
    }
    return walletAsset;
  });
};


export const serveGetWalletAssets = async (req, res) => {
  const wallet = req.params.ownerAddress;
  const assets = await getWalletAssets(wallet);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(assets,null,2));
}