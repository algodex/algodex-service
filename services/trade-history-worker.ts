import { getCharts, getAllAssetPrices, Period, getChartsFromCache } from "../api/trade_history";
import { waitForBlock } from "../src/explorer";
import map from "../views/chart/map";

const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const convertQueueURL = require('../src/convert-queue-url');
const initOrGetIndexer = require('../src/get-indexer');
const withQueueSchemaCheck = require('../src/schema/with-queue-schema-check');
const {waitForViewBuildingSimple} = require('./waitForViewBuilding');
const throttle = require('lodash.throttle');
const axios = require('axios').default;

let latestBlock;
const getLatestBlock = throttle(async () => {
  latestBlock = await waitForBlock({
    round: 1,
  });
}, 3000);


const getChartCacheKeyToRev = async (oldCacheDocs):Promise<Map<string,string>> => {
  return oldCacheDocs.reduce((map, doc) => {
    map.set(doc.key, doc.value.rev);
    return map;
  }, new Map<string,string>());
};

interface CurrentChartsCache {
  assetId:number,
  period:Period,
  cache:any
}

const rebuildChartsCache = async (viewCacheDB, queueRound:number, assetIds:Set<number>) => {
  if (assetIds.size === 0) {
    return;
  }
  await getLatestBlock();
  const latestBlockRound = latestBlock['last-round'];
  if (queueRound < latestBlockRound - 5) {
    // This is happening during a resync, so simply return
    return;
  }
  const periods:Array<Period> = ['1d', '4h', '1h' , '15m', '5m', '1m'];

  const currentChartsCachePromises:Promise<CurrentChartsCache>[] = Array.from(assetIds).flatMap(assetId => periods
    .filter(period => {
      const key = `trade_history:charts:${assetId}:${period}`;
      return !ignoreCacheIdSet.has(key);
    })
    .map(period => getChartsFromCache(assetId, period).then(result => {
        return <CurrentChartsCache>{
          assetId, period, cache:result
        };
      })));
  const currentCaches = await Promise.all(currentChartsCachePromises);
  const keyToCurrentCache:Map<string,CurrentChartsCache> = currentCaches.reduce((map, cache) => {
    const key = `trade_history:charts:${cache.assetId}:${cache.period}`;
    map.set(key, cache);
    console.log(`Setting current cache key: ${key}`);
    console.log(`Setting current cache cache: ${cache}`);
    return map;
  }, new Map<string,CurrentChartsCache>);
  const docs = await viewCacheDB.query('view_cache/currentCache', {reduce: false});
  const ignoreCacheDocs = docs.rows.filter(doc => doc.value.round >= queueRound);
  const ignoreCacheIdSet = new Set(ignoreCacheDocs.map(doc => doc.key));

  // FIXME - somehow iterate over this from the definition
  const promises = Array.from(assetIds).flatMap(assetId => periods
    .filter(period => {
      const key = `trade_history:charts:${assetId}:${period}`;
      return !ignoreCacheIdSet.has(key);
    }).map(period => {
      console.log(`getting charts for ${assetId} ${period}`);
      const chartDataPromise = getCharts(assetId, period, false).then(chartData => {
        return {
          assetId, period, chartData
        };
      });
    return chartDataPromise;
  }));
  const allChartData = await Promise.all(promises);
  const cacheKeyToRev = await getChartCacheKeyToRev(docs.rows);

  const newDocs = allChartData.map(result => {
    const id = `trade_history:charts:${result.assetId}:${result.period}`;
    const rev = cacheKeyToRev.get(id);
    console.log(`updating charts for ${rev} ${id}`);
    return {
      _id: id,
      _rev: rev,
      round: queueRound,
      cachedData: result.chartData
    };
  });

  await viewCacheDB.bulkDocs(newDocs);
}

// Delete the cache of the reverse proxy so it gets refreshed again
const deleteCache = async (assetSet:Set<number>, ownerAddrSet:Set<string>) => {
  const reverseProxyAddr = process.env.CACHE_REVERSE_PROXY_SERVER;
   const headers = {'Clear-Cache': true,
    'Clear-Cache-Key': process.env.CACHE_REVERSE_PROXY_KEY};

  const clearOwnerCachePromises = Array.from(ownerAddrSet)
  .map(ownerAddr => `${reverseProxyAddr}/trades/history/wallet/${ownerAddr}`)
  .map(url => axios({
    method: 'get',
    url: url,
    timeout: 3000,
    headers
  }));

  const clearAssetCachePromises = Array.from(assetSet)
  .map(assetId => `${reverseProxyAddr}/trades/history/asset/${assetId}`)
  .map(url => axios({
    method: 'get',
    url: url,
    timeout: 3000,
    headers
  }));

  await Promise.all([...clearOwnerCachePromises, ...clearAssetCachePromises]);
};

const rebuildCurrentOrdersCache = async (viewCacheDB, queueRound:number) => {
  await getLatestBlock();
  const latestBlockRound = latestBlock['last-round'];
  if (queueRound < latestBlockRound - 5) {
    // This is happening during a resync, so simply return
    return;
  }
  const docs = await viewCacheDB.query('view_cache/currentCache', 
    {reduce: false, key: 'allPrices'
  });

  const rev = docs.rows.length > 0 ? docs.rows[0].value.rev : undefined;

  const allAssetPriceData = await getAllAssetPrices();
  const id = `allPrices`;

  const newDoc = {
      _id: id,
      _rev: rev,
      round: queueRound,
      cachedData: allAssetPriceData
  };

  await viewCacheDB.put(newDoc);
}
module.exports = ({queues, databases}) =>{
  const blockDB = databases.blocks;
  const escrowDB = databases.escrow;
  const viewCacheDB = databases.view_cache;
  const assetDB = databases.assets;
  const formattedHistoryDB = databases.formatted_history;
  const indexer = initOrGetIndexer();
  // Lighten the load on the broker and do batch processing
  console.log({blockDB});
  console.log('in trade-history-worker.js');
  const tradeHistoryWorker = new Worker(convertQueueURL('tradeHistory'), async job=>{
    const blockId:string = job.data.block;
    console.log('received block: ' + blockId);
    await waitForViewBuildingSimple();

    withQueueSchemaCheck('tradeHistory', job.data);

    // 1. Get valid escrows from trade history
    // 2. Get asset information from DB
    //    (job will fail and retry if asset info not in DB)
    // 3. Mix data
    // 4. Submit to trade history DB

    return blockDB.query('blocks/tradeHistory',
        {reduce: false, key: blockId})
        .then(async function(res) {
          // 16583630:CkN1Vt1ySx4NB+yvxPwohSmT1GZXyT6eDN+3S28DxZ0=
          const tradeHistoryRows = res.rows;
          if (tradeHistoryRows.length === 0) {
            return;
          }
          const accounts = tradeHistoryRows.map(row => row.value.escrowAddr);
          return escrowDB.query('escrow/escrowAddr',
              {reduce: false, keys: accounts}).then(async function(res) {
            const innerRows = res.rows;

            // This gets around a race condition that only happens during
            // testing and when starting from scratch with no blocks loaded
            // except from a random point
            const inIntegrationTest = process.env.INTEGRATION_TEST_MODE &&
              process.env.INTEGRATION_TEST_MODE != '0';

            if (innerRows.length === 0 && !inIntegrationTest) {
              return;
            }

            const ownerAddrSet:Set<string> = innerRows.map(row => row.value)
            .reduce( (set, ownerAddr) => set.add(ownerAddr), new Set());

            const validAccountsSet = innerRows.map(row => row.key)
                .reduce( (set, account) => set.add(account), new Set());

            const assetIds = tradeHistoryRows
                .map( row => row.value)
                .filter( row => validAccountsSet.has(row.escrowAddr) ||
                  inIntegrationTest)
                .map( row => `${row.asaId}` );

            return assetDB.query('assets/assets',
                {reduce: false, keys: assetIds})
                .then(async function(res) {
                  const assetToDecimalsFromDB = res.rows.reduce(
                      (obj, row) => {
                        // eslint-disable-next-line max-len
                        obj[`assetId:${row.key}`] = row.value.asset.params.decimals;
                        return obj;
                      }, {});
                  const foundAssets =
                    new Set(res.rows.map(row => parseInt(row.key)));
                  const unknownAssets =
                    assetIds.map(assetId => parseInt(assetId))
                        .filter(assetId => !foundAssets.has(assetId));
                  const assetPromises = unknownAssets.map(assetId =>
                    indexer.lookupAssetByID(assetId).do());
                  const assetResults = await Promise.all(assetPromises);
                  const assetResultsMap = assetResults.reduce((obj, result) => {
                    const assetId = result.asset.index;
                    const decimals = result.asset.params.decimals;
                    obj[`assetId:${assetId}`] = decimals;
                    return obj;
                  }, {});
                  const assetToDecimals = {...assetToDecimalsFromDB, ...assetResultsMap};

                  const validHistoryRows = tradeHistoryRows
                      // eslint-disable-next-line max-len
                      .filter(row => validAccountsSet.has(row.value.escrowAddr) || inIntegrationTest)
                      .map(row => row.value);

                  validHistoryRows.forEach( row => {
                    const assetId = row.asaId;
                    row.assetDecimals = assetToDecimals[`assetId:${assetId}`];
                    row._id = `${row.block}:${row.groupId}`;
                  },
                  );
                  await formattedHistoryDB.bulkDocs(
                      validHistoryRows.map( row =>
                        withSchemaCheck('formatted_history', row)));
                  const assetSet = new Set<number>(validHistoryRows.map(row => row.asaId));
                  return Promise.all([
                    deleteCache(assetSet, ownerAddrSet),
                    rebuildCurrentOrdersCache(viewCacheDB, parseInt(blockId)),
                    rebuildChartsCache(viewCacheDB, parseInt(blockId), assetSet)
                  ]);
                });
          }).catch(function(e) {
            if (e.error === 'not_found') {
              // This should only happen when testing if you
              // don't start at contract genesis block
              console.error(e);
            } else {
              throw e;
            }
          });
        }).catch(function(e) {
          console.log(e);
          throw e;
        });
  }, {connection: queues.connection, concurrency: 250});

  tradeHistoryWorker.on('error', err => {
    console.error( {err} );
    throw err;
  });
};

export {};

