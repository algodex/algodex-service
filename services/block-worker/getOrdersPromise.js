const verifyContracts = require('../../src/verify-contracts');
const getAssetQueuePromise = require('../block-worker/getAssetQueuePromise');

const removeEarliestRound = (rows, round) => {
  if (!rows.length) {
    return [];
  }
  const newRows = rows.filter(row => row.value.earliestRound <= round)
      .map(row => {
        return {...row};
      })
      .map(row => {
        delete row.value['earliestRound'];
        delete row.value['round'];
        return row;
      });
  return newRows;
};

const getAssetsAndOrdersPromises = ({queues, validRows, blockData}) => {
  const assetIdSet = {};
  return validRows.reduce( (allPromises, row) => {
    const assetId = row.value.assetId;
    if (!('assetId:assetIds' in assetIdSet)) {
      assetIdSet[assetId] = 1;
      const assetAddPromise = getAssetQueuePromise(
          queues.assets,
          assetId,
      );
      allPromises.push(assetAddPromise);
    }

    const account = row.key[0];

    const ordersJob = {account: account,
      blockData: blockData, reducedOrder: row};
    console.log('queuing order: ' + ordersJob.account + ' ' +
      ordersJob.blockData.rnd);
    const promise = queues.orders.add('orders', ordersJob,
        {removeOnComplete: true}).then(function() {
    }).catch(function(err) {
      console.error('error adding to orders queue:', {err} );
      throw err;
    });
    allPromises.push(promise);
    return allPromises;
    // //console.log('adding to orders');
  }, []);
};
const getOrdersPromise = ({databases, queues, dirtyAccounts, blockData}) => {
  return databases.blocks.query('blocks/orders',
      {reduce: true, group: true, keys: dirtyAccounts})
      .then(async function(res) {
        // This below situation occurs during testing. Basically, the
        // known earliest round is after the current round because
        // the block where the order was initialized
        // wasn't yet in the database. So, filter any unknown orders

        res.rows = removeEarliestRound(res.rows, blockData.rnd);
        if (!res.rows.length) {
          return;
        }
        const accountsToVerify = res.rows;

        console.log('verifying ' + blockData.rnd,
            JSON.stringify(accountsToVerify));
        const validRows = await verifyContracts(res.rows,
            databases.verified_account);
        console.log('got valid rows: ' + JSON.stringify(validRows));

        const assetsAndOrdersPromises =
          getAssetsAndOrdersPromises({queues, validRows, blockData});

        return Promise.all(assetsAndOrdersPromises);
      }).catch(function(err) {
        if (err.error === 'not_found') {
          // //console.log('not found');
          throw err;
        } else {
          //console.log('reducer error!!!');
          //console.log(err);
          throw err;
        }
      });
};

module.exports = getOrdersPromise;
