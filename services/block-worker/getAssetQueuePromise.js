
const getAssetQueuePromise = (assetQueue, assetId) => {
  const assetAddJob = {assetId: assetId};
  const promise = assetQueue.add('assets', assetAddJob,
      {removeOnComplete: true}).then(function() {
    //console.log('added asset: ' + assetId);
  }).catch(function(err) {
    console.error('error adding to assets queue:', {err} );
    throw err;
  });
  return promise;
};

module.exports = getAssetQueuePromise;
