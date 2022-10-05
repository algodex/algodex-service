import { getOpenOrders, getSpreads } from "./orders";
import { getAlgoPrice, getAlgxBalance, getDatabase, isOptedIn } from "./util";
require('dotenv').config();

// const bodyParser = require('body-parser');
const withSchemaCheck = require('../src/schema/with-db-schema-check');

const tableify = require('tableify');
const axios = require('axios').default;


const generateRewardsSaveKey = (wallet:string, assetId:number, epoch:number) => {
  return `${epoch}:${wallet}:${assetId}`;
}

export const get_rewards_per_epoch = async (req, res) => {
  const {wallet} = req.params;
  let asTable = req.query.asTable;
  const db = getDatabase('rewards');
  const rewards = await db.query('rewards/rewards', {
    reduce: false,
    key: wallet
  })

  rewards.rows.sort((a, b) => (a.epoch > b.epoch ? -1 : 1));
  const message = rewards.rows.length > 0 ? 'Sorry, no rewards exist for this wallet.': undefined;
  const result = {
    result: rewards.rows,
    message,
  }
  if (asTable && rewards.rows.length > 0) {
    res.setHeader('Content-Type', 'text/html');
    const html = tableify(rewards.rows.map(entry => {
      delete entry.value.depthRatio;
      entry.value.avgLiquidityUSD = (entry.value.depthSum / 10080).toLocaleString();
      delete entry.value.depthSum;
      delete entry.value.qualitySum;
      delete entry.value.algxAvg;
      entry.value.earnedAlgx = entry?.value?.earnedRewardsFormatted ? entry.value.earnedRewardsFormatted.toLocaleString() : 0;
      delete entry.value.earnedRewardsFormatted;
      return entry.value;
    }));
    res.send(html);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(result));
  }
};

export const save_rewards = async (req, res) => {

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
      depthRatio: rewardsResult.depth.val,
      depthSum: rewardsResult.sumDepth.val,
      qualitySum: rewardsResult.qualitySum.val,
      algoTotalDepth: rewardsResult.algoTotalDepth.val,
      asaTotalDepth: rewardsResult.asaTotalDepth.val,
      algxAvg: rewardsResult.algxBalanceSum.val,
      qualityFinal: earnedAlgxEntry.quality.val,
      earnedRewardsFormatted: earnedAlgxEntry.earnedAlgx.val,
      rewardsAssetId: parseInt(process.env.ALGX_ASSET_ID!),
      epoch: saveRewardsReqData.epoch,
      accrualAssetId: assetId,
      updatedAt: utc
    }
    return withSchemaCheck('rewards', dataForSaving);
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
}
export const serveGetRewardsDistribution = async (req, res) => {
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
  res.send(JSON.stringify(statusData.rows))
}

export const serveGetLeaderboard = async (req, res) => {
  const db = getDatabase('rewards');
  const topWallets = await db.query('rewards/topWallets', {
    reduce: true,
    group: true
  })
  topWallets.rows.sort((a, b) => (a.value > b.value ? -1 : 1));

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(topWallets.rows,null,2));
};

export const serveRewardsData = async (req, res) => {
  const wallet = req.params.wallet;
  res.setHeader('Content-Type', 'application/json');
  const rewardsData = await getRewardsData(wallet);
  res.json(rewardsData);
}
export const getRewardsData = async (wallet) => {
  if (wallet) {
    const rewardsDB = getDatabase('rewards');
    const rewardsData = await rewardsDB.query('rewards/rewards', {
      reduce: false,
      keys: [wallet],
    })
    return rewardsData.rows;
  } else {
    throw new TypeError('You cannot get rewards with an invalid address')
  }
}
export const serveVestedRewardsData = async (req, res) => {
  const wallet = req.params.wallet;
  res.setHeader('Content-Type', 'application/json');
  const rewardsData = await getVestedRewardsData(wallet);
  res.json(rewardsData);
}
export const getVestedRewardsData = async (wallet) => {
  if (wallet) {
    const rewardsDB = getDatabase('vested_rewards');
    const rewardsData = await rewardsDB.query('vested_rewards/vested_rewards', {
      reduce: false,
      keys: [wallet],
    });
    return rewardsData.rows;
  } else {
    throw new TypeError(
      'You cannot get vested rewards with an invalid address'
    )
  }
}

export const serveRewardsIsRecorded = async (req, res) => {
  const db = getDatabase('rewards');
  const {epoch} = req.params;

  const data = await db.query('rewards/isRecorded', {
    key: parseInt(epoch)
  })

  const isRecorded = data.rows.length > 0;

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({isRecorded, epoch}));
};

const getSecondsInEpoch = () => {
  return 604800;
}

export const getEpochStart = (epoch) => {
  const start = parseInt(process.env.EPOCH_LAUNCH_UNIX_TIME);
  return start + getSecondsInEpoch() * (epoch - 1);
}

export const getUnrecordedEpochs = async () => {
  const db = getDatabase('rewards');

  const curr_unix = Math.floor(new Date().getTime() / 1000);
  const epoch = Math.floor((curr_unix - getEpochStart(1)) / 604800 + 1);
  console.log({epoch});
  const lastEpoch = epoch - 1;
  console.log({lastEpoch});
  const epochs = Array(lastEpoch).fill(1).map((element, index) => index + 1)

  const data = await db.query('rewards/isRecorded', {
    keys: epochs
  })

  const recordedEpochSet:Set<number> = data.rows
    .map(row => row.key)
    .reduce((set, epoch) => {
      set.add(epoch);
      return set;
    }, new Set<number>());

  const unrecordedEpochs = epochs.filter(epoch => !recordedEpochSet.has(epoch));
  return unrecordedEpochs;
}

export const serveUnrecordedRewards = async (req, res) => {
  const unrecordedEpochs = await getUnrecordedEpochs();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(unrecordedEpochs));
};

export const serveIsOptedIn = async (req, res) => {
  const {wallet} = req.params;

  const optedIn = await isOptedIn(wallet);

  res.setHeader('Content-Type', 'application/json');
  const retdata = {
    wallet, optedIn
  }
  res.send(JSON.stringify(retdata));
};

export const isAccruingRewards = async (req, res) => {
  const {wallet} = req.params;

  res.setHeader('Content-Type', 'application/json');

  const algoPrice:number|undefined = await (async () => {
    try {
      const algoPrice = await getAlgoPrice();
      return algoPrice;
    } catch (e) {
      const retdata = {'serverError': 'Cannot fetch prices from Tinyman'};
      res.status(500).json(retdata);
      return;
    }
  })();
  if (!algoPrice) {
    return;
  }

  const optedIntoRewards = await isOptedIn(wallet);
  // if (!optedIntoRewards) {
  //   const retdata = {
  //     wallet, optedIntoRewards, isAccruingRewards: false, 
  //     notAccruingReason: 'Not opted into ALGX rewards'
  //   };
  //   res.send(JSON.stringify(retdata));
  //   return;
  // }

  const algxBalance = await getAlgxBalance(wallet);
  if (algxBalance < (3000 * 1000000)) { // 3,000 ALGX
    const retdata = {
      wallet, optedIntoRewards, isAccruingRewards: false, 
      notAccruingReason: `Insufficient ALGX Balance. Must be over 3000. Current balance: ${algxBalance}`
    };
    res.send(JSON.stringify(retdata));
    return;
  };

  const openOrders = await (async () => {
    try {
      return await getOpenOrders(wallet);
    } catch (e) {
        const retdata = {'serverError': 'Cannot fetch open orders'};
        res.status(500).json(retdata);
        return;
    }
  })();
  if (!openOrders) {
    return;
  };

  const openOrdersByAsset = openOrders.reduce((assetToOrders, order) => {
      const { assetId } = order;
      const ordersArr = assetToOrders.get(assetId) || new Array<Order>();
      assetToOrders.set(assetId, ordersArr);
      ordersArr.push(order);
      return assetToOrders;
  }, new Map<number,Array<Order>>);

  const assetIds = Array.from(openOrdersByAsset.keys());
  const assetIdToSpread = await getSpreads(assetIds);
  let syncIssue = false; //FIXME - switch to better error handling
  const assetsWithBidAndAsk = assetIds.filter(assetId => {
    if (syncIssue) {
      return false;
    }
    const orders = openOrdersByAsset.get(assetId)!;
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
    if (!spread?.highestBid?.maxPrice || !spread?.lowestAsk?.minPrice) {
      const retdata = {'serverError': 'Sync issue in backend. Please contact Algodex support'};
      res.status(500).json(retdata);
      syncIssue = true;
      return false;
    }
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

  if (syncIssue) {
    return;
  }
  if (assetsWithBidAndAsk.length == 0) {
    const retdata = {
      wallet, optedIntoRewards, algxBalance, isAccruingRewards: false, 
      notAccruingReason: `Must have both a buy and sell order for any given trading pair, with minimum USD$50 bid and $100 ask, at a bid/ask spread less than 5%,` 
       + ` to accrue rewards. The spread is defined as the distance between your order's price and the midpoint of the lowest ask and highest bid of the orderbook.` 
    };
    res.send(JSON.stringify(retdata));
    return;
  }

  const retdata = {
    wallet, optedIntoRewards, algxBalance, isAccruingRewards: true, assetsAccruingRewards: assetsWithBidAndAsk
  };
  res.send(JSON.stringify(retdata));
  return;
};