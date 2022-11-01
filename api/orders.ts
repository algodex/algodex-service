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

export const getHiddenOrderAddrs = async (assetId:number):Promise<Array<string>> => {
  const v1Orders = await getV1Orders([assetId]);
  const v2Orders = await getV2OrdersByAssetId(assetId);

  const v1OrderAddrs = new Set([...v1Orders[0].buyASAOrdersInEscrow.map(order => order.escrowAddress),
    ...v1Orders[0].sellASAOrdersInEscrow.map(order => order.escrowAddress)]);
  const v2OrderAddrs = v2Orders.map(order => order.escrowAddress);

  return v2OrderAddrs.filter(addr => !v1OrderAddrs.has(addr));
};

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

export interface AssetTVL {
  assetId:number,
  formattedAlgoTVL:number,
  formattedAssetTVL:number
}

export type AssetId = number

const getTVL = async ():Promise<AssetTVL[]> => {
  const db = getDatabase('formatted_escrow');
  const tvlData = await db.query('formatted_escrow/tvl', {
    reduce: true, group: true
  });

  return tvlData.rows.map(row => {
    return {
      assetId: row.key,
      formattedAlgoTVL: row.value.algoAmount,
      formattedAssetTVL: row.value.asaAmount
    };
  });
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

export const getV1Orders = async (assetIds:Array<number>):Promise<Array<V1OrdersResult>> => {
  const getEmptyOrderPromise = (assetId:number):Promise<V1OrdersResult> => {
    return new Promise((resolve) => resolve({
      buyASAOrdersInEscrow:[],
      sellASAOrdersInEscrow:[],
      assetId,
      timer:undefined
    }));
  };

  const promises:Array<Promise<V1OrdersResult>> = assetIds.map(assetId => {
    if (assetId === 399383365) { // V1 API doesn't work with this
      return getEmptyOrderPromise(assetId);
    }
    if (cachedAssetIdToOrders.has(assetId)) {
      clearTimeout(cachedAssetIdToOrders.get(assetId)!.timer);
      cachedAssetIdToOrders.get(assetId)!.timer = setTimeout(() => {
        cachedAssetIdToOrders.delete(assetId);
      }, 60*1000);
      return new Promise((resolve) => resolve(cachedAssetIdToOrders.get(assetId)!));
    }
    return axios.get(`https://app.algodex.com/algodex-backend/orders.php?assetId=${assetId}`)
      .then(async (res) => {
        const json:V1OrdersResult = res.data;
        json.assetId = assetId;
        json.timer = setTimeout(() => {
          cachedAssetIdToOrders.delete(assetId);
        }, 60*1000);
        cachedAssetIdToOrders.set(assetId, json);
        return json;
      }).catch((err) => {
        console.error(err, `https://app.algodex.com/algodex-backend/orders.php?assetId=${assetId}`);
      });
  });
  let results:Array<V1OrdersResult> = await Promise.all(promises);
  return results;
};

export const getV2OrdersByAssetId =  async (assetId:number):Promise<DBOrder[]> => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/orders', {
    key: ['assetId', assetId],
  });

  return data.rows.map(row => row.value);
}

export interface V1OrderApi {
  sellASAOrdersInEscrow:V1Order[],
  buyASAOrdersInEscrow:V1Order[]
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


export const serveGetOrdersByAssetId = async (req, res) => {
  const assetId = parseInt(req.params.assetId);
  const orders:DBOrder[] = await getV2OrdersByAssetId(assetId);

  const ordersConverted = mapDBtoV1Orders(orders);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(ordersConverted));
}


export const serveGetOrdersByWallet = async (req, res) => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/orders', {
    key: ['ownerAddr', req.params.ownerAddress],
  });

  const orders:DBOrder[] = data.rows.map(row => row.value);

  const allOrders = mapDBtoV1Orders(orders);

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(allOrders));
}