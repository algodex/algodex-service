
const getAssetQueuePromise = (assetQueue, assetId) => {
  const assetAddJob = {assetId: assetId};
  const promise = assetQueue.add('assets', assetAddJob,
      {removeOnComplete: true}).catch(function(err) {
    console.error('error adding to assets queue:', {err} );
    throw err;
  });
  return promise;
};

module.exports = getAssetQueuePromise;
