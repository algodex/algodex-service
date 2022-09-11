
/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

const express = require('express')

const PouchDB = require('pouchdb')
const PouchMapReduce = require('pouchdb-mapreduce');
// const bodyParser = require('body-parser');

PouchDB.plugin(PouchMapReduce)

const app = express()
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
const port = 3006

const getDatabase = (dbname:string) => {
  const fullUrl = process.env.COUCHDB_BASE_URL + '/' + dbname
  // console.log({fullUrl});
  const db = new PouchDB(fullUrl)
  return db
}


interface WrappedNumber {
  val: number
}

interface OwnerRewardsResult {
  algxBalanceSum: WrappedNumber,
  qualitySum: WrappedNumber,
  uptime: WrappedNumber,
  depth: WrappedNumber
}

interface EarnedAlgxEntry {
  quality: WrappedNumber,
  earnedAlgx: WrappedNumber
}

// These should be simple maps, but no easy way to do this
interface OwnerRewardsAssetToResMapObj {
  [key: string]: OwnerRewardsResult
}
interface OwnerRewardsWalletToAssetMapObj {
  [key: string]: OwnerRewardsAssetToResMapObj
}

interface OwnerWalletAssetToFinalRewardsMapObj {
  [key: string]: EarnedAlgxEntry
}

interface SaveRewardsRequest {
  ownerRewards: OwnerRewardsWalletToAssetMapObj,
  ownerRewardsResToFinalRewardsEntry: OwnerWalletAssetToFinalRewardsMapObj,
  epoch: number
}

interface CouchRewardsData {
  _id: string,
  _rev?: string,
  ownerWallet: string,
  uptime: number,
  depthSum: number,
  qualitySum: number,
  algxAvg: number,
  qualityFinal: number,
  earnedRewards: number,
  epoch: number,
  assetId: number,
  updatedAt: string
}

interface OwnerRewardsKey {
  wallet: string,
  assetId: number
}

const generateRewardsSaveKey = (wallet:string, assetId:number, epoch:number) => {
  return `${epoch}:${wallet}:${assetId}`;
}

app.post('/query/:database/_design/:index/_view/:view', async (req, res) => {

  const {database, index, view} = req.params;
  const {keys, group} = req.body.queries[0]

  console.log( {database, index, view, keys, group}); 

  const db = getDatabase(database);
  try {
    const dbResult = await db.query(`${index}/${view}`,
    {
      group, keys
    });
    res.setHeader('Content-Type', 'application/json');
    res.send(dbResult);
  } catch (e) {
    res.send(e);
    return;
  }

})

app.post('/save_rewards', async (req, res) => {
  console.log('Got body:', req.body);

  const saveRewardsReqData = <SaveRewardsRequest>(req.body);
  const db = getDatabase('rewards');

  const rewardsDataDocs = Object.keys(saveRewardsReqData.ownerRewardsResToFinalRewardsEntry).map(data => {
    const walletAssetKey = <OwnerRewardsKey>JSON.parse(data);
    const earnedAlgxEntry = saveRewardsReqData.ownerRewardsResToFinalRewardsEntry[data];
    const wallet = walletAssetKey.wallet;
    const assetId = walletAssetKey.assetId;
    const rewardsResult = saveRewardsReqData.ownerRewards[walletAssetKey.wallet][walletAssetKey.assetId.toString()];

    const rewardsSaveKey = generateRewardsSaveKey(wallet, assetId, saveRewardsReqData.epoch);
    var date = new Date();
    const utc = date.toUTCString()
    const dataForSaving:CouchRewardsData = {
      _id: rewardsSaveKey,
      ownerWallet: wallet,
      uptime: rewardsResult.uptime.val,
      depthSum: rewardsResult.depth.val,
      qualitySum: rewardsResult.qualitySum.val,
      algxAvg: rewardsResult.algxBalanceSum.val,
      qualityFinal: earnedAlgxEntry.quality.val,
      earnedRewards: earnedAlgxEntry.earnedAlgx.val,
      epoch: saveRewardsReqData.epoch,
      assetId,
      updatedAt: utc
    }
    return dataForSaving;
  });

  // FIXME - reset old rewards to 0


  const allDocs = await db.allDocs();
  const idToRev = allDocs.rows.reduce((map, row) => {
    map.set(row.id,row.value.rev);
    return map
  }, new Map<String, String>);

  rewardsDataDocs.forEach(doc => {
    doc._rev = idToRev.get(doc._id);
  });

  try {
    await db.bulkDocs(rewardsDataDocs);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
    res.send(e);
    return;
  }
  res.sendStatus(200);
});

const isOptedIn = async (wallet:string):Promise<boolean> => {
  const db = getDatabase('blocks');
  const data = await db.query('blocks/algxRewardsOptin', {
    key: wallet,
    limit: 1,
  });

  const optedIn = data.rows.length > 0 && data.rows[0].key === wallet && data.rows[0].value === 1;
  return optedIn;
}

const getAlgxBalance = async (wallet:string):Promise<number> => {
  const db = getDatabase('algx_balance');
  const data = await db.query('algx_balance/algx_balance', {
    key: wallet,
    limit: 1,
    reduce: true
  });

  const algxBalance:number = data.rows.length > 0 ? data.rows[0].value.balance : 0;
  return algxBalance;
}

interface Order {
  "ownerAddress": string,
  "escrowAddress": string,
  "algoAmount": number,
  "asaAmount": number,
  "assetLimitPriceD": number,
  "assetLimitPriceN": number,
  "asaPrice": number,
  "formattedPrice": number,
  "formattedASAAmount": number,
  "round": number,
  "unix_time": number,
  "decimals": number,
  "version": string,
  "isAlgoBuyEscrow": boolean,
  "assetId": number
}

const getOpenOrders = async (wallet:string):Promise<Array<Order>> => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/orders', {
    key: ['ownerAddr', wallet],
  });

  return data.rows.map(entry => entry.value);
}


interface HighestBid {
  maxPrice: number,
  isAlgoBuyEscrow: 'true',
}
interface LowestAsk {
  minPrice: number,
  isAlgoBuyEscrow: 'false',
}
interface Spread {
  highestBid:HighestBid,
  lowestAsk:LowestAsk
}
const getSpreads = async (assetIds:Array<number>):Promise<Map<number, Spread>> => {
  const db = getDatabase('formatted_escrow');
  const data = await db.query('formatted_escrow/spreads', {
    keys: assetIds,
    reduce: true,
    group: true
  });

  return data.rows.reduce((map, row) => {
    map.set(row.key, row.value);
    return map;
  }, new Map<number, Spread>);
}

const getAlgoPrice = async():Promise<number> => {
  const tinyManUrl = 'https://mainnet.analytics.tinyman.org/api/v1/current-asset-prices/';
  const pricesReq = await fetch(tinyManUrl);
  const prices = await pricesReq.json();
  return prices[0].price;
}

app.get('/rewards/is_accruing/:wallet', async (req, res) => {
  const {wallet} = req.params;

  res.setHeader('Content-Type', 'application/json');
  const algoPrice = await getAlgoPrice();

  const optedIntoRewards = await isOptedIn(wallet);
  // if (!optedIntoRewards) {
  //   const retdata = {
  //     wallet, optedIntoRewards, isAccruingRewards: false, 
  //     notAccruingReason: 'Not opted into ALGX rewards'
  //   };
  //   res.end(JSON.stringify(retdata));
  //   return;
  // }

  const algxBalance = await getAlgxBalance(wallet);
  if (algxBalance < (3000 * 1000000)) { // 3,000 ALGX
    const retdata = {
      wallet, optedIntoRewards, isAccruingRewards: false, 
      notAccruingReason: `Insufficient ALGX Balance. Must be over 3000. Current balance: ${algxBalance}`
    };
    res.end(JSON.stringify(retdata));
    return;
  }

  const openOrders = await getOpenOrders(wallet);

  const openOrdersByAsset = openOrders.reduce((assetToOrders, order) => {
      const { assetId } = order;
      const ordersArr = assetToOrders.get(assetId) || new Array<Order>();
      assetToOrders.set(assetId, ordersArr);
      ordersArr.push(order);
      return assetToOrders;
  }, new Map<number,Array<Order>>);

  const assetIds = Array.from(openOrdersByAsset.keys());
  const assetIdToSpread = await getSpreads(assetIds);
  const assetsWithBidAndAsk = assetIds.filter(assetId => {
    const orders = openOrdersByAsset.get(assetId);
    const buyOrders = orders.filter(order => order.isAlgoBuyEscrow);
    const sellOrders = orders.filter(order => !order.isAlgoBuyEscrow);
    if (buyOrders.length == 0 || sellOrders.length == 0) {
      return false;
    }
    buyOrders.sort((a,b) => b.asaPrice - a.asaPrice);
    sellOrders.sort((a,b) => a.asaPrice - b.asaPrice);

    // const highestBid = buyOrders[0];
    // const lowestAsk = sellOrders[0];
    const spread = assetIdToSpread.get(assetId);
    const midpoint = (spread.highestBid.maxPrice + spread.lowestAsk.minPrice) / 2;
    const getSpread = (order:Order):number => 
      Math.abs((order.formattedPrice - midpoint) / midpoint);

    const buyDepth = (order:Order):number => 
      order.algoAmount/1000000 * algoPrice;
    const sellDepth = (order:Order):number => 
      order.asaPrice * order.asaAmount * algoPrice / (10**(6-order.decimals));

    if (!buyOrders.find(order => buyDepth(order) >= 50 && getSpread(order) < 0.05)) {
      return false;
    }

    if (!sellOrders.find(order => sellDepth(order) >= 100 && getSpread(order) < 0.05)) {
      return false;
    }
    return true;
  });

  if (assetsWithBidAndAsk.length == 0) {
    const retdata = {
      wallet, optedIntoRewards, algxBalance, isAccruingRewards: false, 
      notAccruingReason: `Must have both a buy and sell order for any given trading pair, with minimum USD$50 bid and $100 ask, at a bid/ask spread less than 5%,` 
       + ` to accrue rewards. The spread is defined as the distance between your order's price and the midpoint of the lowest ask and highest bid of the orderbook.` 
    };
    res.end(JSON.stringify(retdata));
    return;
  }

  const retdata = {
    wallet, optedIntoRewards, algxBalance, isAccruingRewards: true, assetsAccruingRewards: assetsWithBidAndAsk
  };
  res.end(JSON.stringify(retdata));
  return;
});

app.get('/wallets/leaderboard', async (req, res) => {
  const db = getDatabase('rewards');
  const topWallets = await db.query('rewards/topWallets', {
    reduce: true,
    group: true
  })
  topWallets.rows.sort((a, b) => (a.value > b.value ? -1 : 1));

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(topWallets.rows));
});

app.get('/rewards/optin/:wallet', async (req, res) => {
  const {wallet} = req.params;

  const optedIn = await isOptedIn(wallet);

  res.setHeader('Content-Type', 'application/json');
  const retdata = {
    wallet, optedIn
  }
  res.end(JSON.stringify(retdata));
});


app.get('/rewards_distribution', async (req, res) => {
  const db = getDatabase('rewards_distribution');
  const statusData = await db.query('rewards_distribution/rewards_distribution', {
    reduce: false,
    group: false
  })

  // const getPromises = statusData.rows
  //   .map(row => row.value._id)
  //   .filter(id => {
  //     const alreadySeen = idSet.has(id);
  //     idSet.add(id);
  //     return !alreadySeen;
  //   })
  //   .map(id => {
  //     return db.get(id);
  //   });

  // const allDocs = await Promise.all(getPromises);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(statusData.rows))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})