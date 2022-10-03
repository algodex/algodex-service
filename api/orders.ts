const axios = require('axios').default;
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

export const getV2OrdersByAssetId =  async (assetId:number):Promise<Array<V2OrdersResult>> => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/orders', {
    key: ['assetId', assetId],
  });

  return data.rows.map(row => row.value);
}


export const serveGetOrdersByAssetId = async (req, res) => {
  const assetId = parseInt(req.params.assetId);
  const orders = await getV2OrdersByAssetId(assetId);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(orders));
}

export const serveGetOrdersByWallet = async (req, res) => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/orders', {
    key: ['ownerAddr', req.params.ownerAddress],
  });

  const orders = data.rows.map(row => row.value);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(orders));
}