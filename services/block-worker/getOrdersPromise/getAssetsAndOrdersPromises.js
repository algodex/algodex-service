const getAssetQueuePromise = require('./getAssetQueuePromise');

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

module.exports = getAssetsAndOrdersPromises;
