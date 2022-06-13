const compile = require('@algodex/algodex-sdk/lib/order/compile');
const { withOrderbookEntry, withLogicSigAccount } = require('@algodex/algodex-sdk/lib/order/compile');
const algosdk = require('algosdk');

//TODO: import this function instead
/*
function getOrderbookEntry(order) {
  const {
    address,
    contract: {N, D},
    min = 0,
    asset: {id: assetId},
    execution,
  } = order;

  let rtn = N + '-' + D + '-' + min + '-' + assetId;
  if (execution === 'maker') {
    rtn = address + '-' + rtn;
  }
  logger.debug('getOrderbookEntry final str is: ' + rtn);
  return rtn;
}
*/

module.exports = async (escrowAddress, orderEntry, version, ownerAddress, appId, isAlgoBuyEscrow) => {

  const orderSplit = orderEntry.split("-");
  // rec contains the original order creators address
  const assetLimitPriceN = parseInt(orderSplit[0]);
  const assetLimitPriceD = parseInt(orderSplit[1]);
  //const minimumExecutionSizeInAlgo = orderSplit[2];
  const assetId = parseInt(orderSplit[3]);

  const input = {
    'asset': {
      'id': assetId
    },
    'type': isAlgoBuyEscrow ? 'buy' : 'sell',
    'address': ownerAddress,
    'appId': appId,
    'version': version,
    'N': assetLimitPriceN,
    'D': assetLimitPriceD,
    'id': assetId,
    'contract': {
      'N': assetLimitPriceN,
      'D': assetLimitPriceD,
    },
  };
  
  input.client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http://ec2-3-18-80-65.us-east-2.compute.amazonaws.com', 8080 );
  try {
    const compiledOrder = await withLogicSigAccount(withOrderbookEntry(input));
    if (escrowAddress === compiledOrder?.contract?.escrow) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
};
