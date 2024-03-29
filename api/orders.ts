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

const axios = require('axios').default;
import { AssetUnitName, getUnitNames } from "./asset";
import { getDatabase } from "./util";

const cachedAssetIdToOrders = new Map<number, V1OrdersResult>();

export const getV2OrdersByAssetId =  async (assetId:number):Promise<DBOrder[]> => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/orders', {
    key: ['assetId', assetId],
  });

  return data.rows.map(row => row.value);
}

export const serveGetHiddenOrders = async (req, res) => {
  const assetId = parseInt(req.params.assetId);
  try {
    const hiddenAddrs = await getHiddenOrderAddrs(assetId);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(hiddenAddrs));
  } catch (e) {
    res.status(500);
    res.send(JSON.stringify(e));
    return;
  }
};

export interface V1AssetTVL {
  assetId:number,
  asaAmountTotal:number
}

export interface AssetTVL {
  assetId:number,
  formattedAlgoTVL:number,
  formattedAssetTVL:number
}

export type AssetId = number

interface TvlEntry {
  algoAmount:number
  asaAmount:number
}

interface DbTvlData {
  key:number //assetId
  value:TvlEntry
}

export const getTVL = async ():Promise<V1AssetTVL[]> => {
  const db = getDatabase('formatted_escrow');
  const tvlData:DbTvlData[] = (await db.query('formatted_escrow/tvl', {
    reduce: true, group: true
  })).rows;

  const algoTvl = tvlData.reduce((sum, item) => sum + item.value.algoAmount, 0);

  const finalTvlData = tvlData.map(row => ({
      assetId: row.key,
      asaAmountTotal: row.value.asaAmount
    }));
  finalTvlData.push({
    assetId: 0,
    asaAmountTotal: algoTvl
  });

  return finalTvlData;
}

export const getAlgoAndAsaTVLByAsset = async ():Promise<AssetTVL[]> => {
  const db = getDatabase('formatted_escrow');
  const tvlData = await db.query('formatted_escrow/tvl', {
    reduce: true, group: true
  });

  const retdata = tvlData.rows.map(row => {
    return {
      assetId: row.key,
      formattedAlgoTVL: row.value.algoAmount,
      formattedAssetTVL: row.value.asaAmount
    };
  });
  return retdata;
}

export const serveGetTVL2 = async (req, res) => {
  // const tvl = await getAlgoAndAsaTVLByAsset();
  const tvl = await getAlgoAndAsaTVLByAsset();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(tvl));
}

export const serveGetTVL = async (req, res) => {
  const tvl = await getTVL();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(tvl));
}

export const getOpenOrders = async (wallet:string):Promise<Array<Order>> => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/orders', {
    key: ['ownerAddr', wallet],
  });

  return data.rows.map(entry => entry.value);
}

interface V2Spread {
  assetId: number //assetId
  formattedPrice: number
  isAlgoBuyEscrow: boolean
}

export const getV2Spreads = async ():Promise<V2Spread[]> => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/spreads', {
    // keys: assetIds,
    reduce: true,
    group: true
  });
  return data.rows.map(item => ({
    assetId: item.key,
    ...item.value
  }));
};

export const getSpreads = async (assetIds:Array<number>):Promise<Map<number, Spread>> => {
  // const db = getDatabase('formatted_escrow');
  // const data = await db.query('formatted_escrow/spreads', {
  //   keys: assetIds,
  //   reduce: true,
  //   group: true
  // });

  const results = await getV1Orders(assetIds);

  const map = results.reduce((map, result) => {
    const highestBid = result.buyASAOrdersInEscrow.reduce((maxOrder:V1OrdersInnerResult|null, order) => {
      if (maxOrder == null) {
        maxOrder = order;
      }
      if (parseFloat(order.formattedPrice) > parseFloat(maxOrder.formattedPrice)) {
        maxOrder = order;
      }
      return maxOrder;
    }, null);
    const lowestAsk = result.sellASAOrdersInEscrow.reduce((minOrder:V1OrdersInnerResult|null, order) => {
      if (minOrder == null) {
        minOrder = order;
      }
      if (parseFloat(order.formattedPrice) < parseFloat(minOrder.formattedPrice)) {
        minOrder = order;
      }
      return minOrder;
    }, null);
    const spread:Spread = {
      highestBid: {
        maxPrice: highestBid?.formattedPrice ? parseFloat(highestBid.formattedPrice) : null,
        isAlgoBuyEscrow: true
      },
      lowestAsk: {
        minPrice: lowestAsk?.formattedPrice ? parseFloat(lowestAsk.formattedPrice) : null,
        isAlgoBuyEscrow: false
      }
    };
    map.set(result.assetId, spread);
    return map;
  }, new Map<number, Spread>);
  return map;
}


const getOrdersFromProxy = async(assetId):Promise<V1OrderApi> => {
  const ordersResult = process.env.CACHE_REVERSE_PROXY_SERVER + '/orders/asset/' + assetId;
  const fetchRes = await axios.get(ordersResult);
  const results:V1OrderApi = fetchRes.data;
  return results;
}

export const getV1Orders = async (assetIds:Array<number>):Promise<Array<V1OrderApi>> => {
  const promises:Array<Promise<V1OrderApi>> = assetIds.map(assetId => {
    return getOrdersFromProxy(assetId).then(res => {
      res.assetId = assetId;
      return res;
    });
  });
  let results:Array<V1OrderApi> = await Promise.all(promises);
  return results;
};

interface OrderAssetParams {
  'unit-name': string,
}

export interface OrderAssetInfo {
  params: OrderAssetParams,
  index: number // asset id
}

export interface V1OrderApi {
  sellASAOrdersInEscrow:V1Order[],
  buyASAOrdersInEscrow:V1Order[],
  assetId?:number
  allAssets?:OrderAssetInfo[]
}
export interface V1Order {
  assetLimitPriceInAlgos: string
  asaPrice: string
  assetLimitPriceD: number
  assetLimitPriceN: number
  algoAmount: number
  asaAmount: number
  assetId: number
  appId: number
  escrowAddress: string
  ownerAddress: string
  version: number
  minimumExecutionSizeInAlgo: number
  round: number
  unix_time: number
  formattedPrice: string
  formattedASAAmount: string
  decimals: number
}

export interface DBOrder {
    algoAmount: number,
    asaAmount: number
    asaPrice: number
    assetId: number
    assetLimitPriceD: number
    assetLimitPriceN: number
    decimals: number
    escrowAddress: string
    formattedASAAmount: number
    formattedPrice: number
    isAlgoBuyEscrow: boolean
    ownerAddress: string
    round: number
    unix_time: number
    version: string
}

const getFormattedAsaAmount = (asaAmount:number, price: number,
  algoAmount:number, assetDecimals:number, escrow:string):string => {

  if (!price || price <= 0) {
    console.error('INVALID PRICE! ' + escrow);
    return '0';
  }

  const tempAsaAmount = asaAmount && asaAmount > 0 ? asaAmount :
    algoAmount / price
  return (tempAsaAmount / (10**assetDecimals)).toFixed(assetDecimals);
}

const mapDBtoV1Orders = (orders:DBOrder[]):V1OrderApi => {
  const formattedOrders:V1Order[] = orders.map(order => {
    const v1Order:V1Order = {
      appId: order.isAlgoBuyEscrow ? parseInt(process.env.ALGODEX_ALGO_ESCROW_APP) :
        parseInt(process.env.ALGODEX_ASA_ESCROW_APP),
      assetLimitPriceInAlgos: order.asaPrice + '',
      asaPrice: order.asaPrice + '',
      assetLimitPriceD: order.assetLimitPriceD,
      assetLimitPriceN: order.assetLimitPriceN,
      algoAmount: order.algoAmount || 0,
      asaAmount: order.asaAmount || 0,
      escrowAddress: order.escrowAddress,
      assetId: order.assetId,
      ownerAddress: order.ownerAddress,
      minimumExecutionSizeInAlgo: 0,
      version: order.version.charCodeAt(0),
      round: order.round,
      unix_time: order.unix_time,
      formattedPrice: order.formattedPrice + '',
      formattedASAAmount: getFormattedAsaAmount(order.asaAmount, order.asaPrice,
        order.algoAmount, order.decimals, order.escrowAddress),
      decimals: order.decimals
    };
    return v1Order;
  });

  const buyOrders = formattedOrders
    .filter(order => order.appId === parseInt(process.env.ALGODEX_ALGO_ESCROW_APP))
  const sellOrders = formattedOrders
    .filter(order => order.appId === parseInt(process.env.ALGODEX_ASA_ESCROW_APP))

  const allOrders = {
    sellASAOrdersInEscrow: sellOrders,
    buyASAOrdersInEscrow: buyOrders
  }
  return allOrders;
}

interface OrderOptInStatus {
  round:number,
  apan:number,
  onComplete:string,
  orderType:string,
  txnCount:number
}

const makeSmallerList = (orders:DBOrder[]) => {
  const buyOrders = orders.filter(order => order.isAlgoBuyEscrow);
  const sellOrders = orders.filter(order => !order.isAlgoBuyEscrow);

  buyOrders.sort((a, b) => b.asaPrice - a.asaPrice);
  sellOrders.sort((a, b) => a.asaPrice - b.asaPrice);
  return [...buyOrders.slice(0, 200), ...sellOrders.slice(0, 200)];
}

const filterNonOptedInOrders = async (orders:DBOrder[]):Promise<DBOrder[]> => {
  const escrowAddrs = orders
    .filter(order => order.isAlgoBuyEscrow === true) // This is only a problem for buy orders
    .map(order => order.escrowAddress);
  //TODO: only check up to a certain amount of escrow addresses sorted by price
  const db = getDatabase('blocks');
  let data;
    try {
    data = await db.query('orderOptinStatus/orderOptinStatus', {
      keys: escrowAddrs,
      reduce: true,
      group: true
    });
  } catch (e) {
    console.error(e);
    throw e;
  }

  const optedInOrders:string[] = data.rows
    .filter(row => row.value.onComplete === 'OptIn')
    .map(row => row.key); //key contains escrow address

  const optedInOrdersSet = new Set<string>(optedInOrders);

  const allOwners = orders
    .map(order => order.ownerAddress + ':' + order.assetId);

  let ownerOptInResults;

  try {
    ownerOptInResults = await db.query('assetOptIn/assetOptIn', {
      keys: allOwners,
      reduce: true,
      group: true
    });
  } catch (e) {
    console.error(e);
    throw e;
  }

  const optedOutOwnersSet = new Set<string>(ownerOptInResults.rows
    .filter(row => row.value.assetChangeType === 'optOut')
    .map(row => row.key.split(':')[0]));

  const optedInOwners:string[] = orders.map(order => order.ownerAddress)
    .filter(owner => !optedOutOwnersSet.has(owner))

  const optedInOwnersSet = new Set<string>(optedInOwners);

  // Allow sell orders with opted-in owners, or buy
  // orders that are opted into the smart contract and the owner is opted in.
  return orders.filter(order =>
    (order.isAlgoBuyEscrow === false && optedInOwnersSet.has(order.ownerAddress)) ||
    (order.isAlgoBuyEscrow === true && optedInOrdersSet.has(order.escrowAddress) &&
      optedInOwnersSet.has(order.ownerAddress))
  );
}

export const getHiddenOrderAddrs = async (assetId:number):Promise<Array<string>> => {
  const v2Orders = await getV2OrdersByAssetId(assetId);

  const v2OrderAddrs = v2Orders.map(order => order.escrowAddress);

  const optedInOrders = await filterNonOptedInOrders(v2Orders);
  const optedInOrdersSet = new Set(optedInOrders.map(order => order.escrowAddress));
  const hiddenOrders = v2OrderAddrs.filter(addr => !optedInOrdersSet.has(addr));

  return hiddenOrders;
};


export const getFilteredV2OrdersByAssetId = async(assetId:number):Promise<DBOrder[]> => {
  const orders:DBOrder[] = await getV2OrdersByAssetId(assetId);
  // screen out by whether orders are opted in
  const filteredOrders = await filterNonOptedInOrders(makeSmallerList(orders));
  return filteredOrders;
}

export const getFilteredV1OrdersByAssetId = async(assetId:number):Promise<V1OrderApi> => {
  const filteredOrders = await getFilteredV2OrdersByAssetId(assetId);
  const ordersConverted = mapDBtoV1Orders(filteredOrders);
  return ordersConverted;
}

export const serveGetOrdersByAssetId = async (req, res) => {
  const orders = await getFilteredV1OrdersByAssetId(parseInt(req.params.assetId));

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(orders));
}


export const serveGetOrdersByWallet = async (req, res) => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/orders', {
    key: ['ownerAddr', req.params.ownerAddress],
  });

  const orders:DBOrder[] = data.rows.map(row => row.value);

  // screen out by whether orders are opted in. TODO: show orders to user which are not opted in
  const filteredOrders = await filterNonOptedInOrders(orders);

  const allOrders = mapDBtoV1Orders(filteredOrders);

  const allAssets = new Set(filteredOrders.map(order => order.assetId));

  const unitNames = await getUnitNames(allAssets);
  const orderUnitNames:OrderAssetInfo[] = unitNames.map(asset => ({
    index: asset.assetId,
    params: {'unit-name': asset.unitName}
  }));
  allOrders.allAssets = orderUnitNames;

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(allOrders));
}