const PouchDB = require('pouchdb')
const PouchMapReduce = require('pouchdb-mapreduce');
// const bodyParser = require('body-parser');
const withSchemaCheck = require('../src/schema/with-db-schema-check');

const tableify = require('tableify');
PouchDB.plugin(PouchMapReduce)
const axios = require('axios').default;


const generateRewardsSaveKey = (wallet:string, assetId:number, epoch:number) => {
  return `${epoch}:${wallet}:${assetId}`;
}

export const getDatabase = (dbname:string) => {
  const fullUrl = process.env.COUCHDB_BASE_URL + '/' + dbname
  // console.log({fullUrl});
  const db = new PouchDB(fullUrl)
  return db
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
      delete entry.value.depthSum;
      delete entry.value.qualitySum;
      delete entry.value.algxAvg;
      entry.value.earnedAlgx = entry?.value?.earnedRewardsFormatted ? entry.value.earnedRewardsFormatted.toLocaleString() : 0;
      delete entry.value.earnedRewardsFormatted;
      return entry.value;
    }));
    res.end(html);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
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
      algxAvg: rewardsResult.algxBalanceSum.val,
      qualityFinal: earnedAlgxEntry.quality.val,
      earnedRewardsFormatted: earnedAlgxEntry.earnedAlgx.val,
      rewardsAssetId: parseInt(process.env.ALGX_ASSET_ID),
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

