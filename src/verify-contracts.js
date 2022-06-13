const compile = require('@algodex/algodex-sdk/lib/order/compile');
const { withOrderbookEntry, withLogicSigAccount } = require('@algodex/algodex-sdk/lib/order/compile');
const algosdk = require('algosdk');

const verifyContract = async (escrowAddress, orderEntry, version, ownerAddress, appId, isAlgoBuyEscrow) => {
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

module.exports = async (rows) => {
  const realContracts = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const account = row.key[0];
    const isRealContract = await verifyContract(account, row.value.orderInfo,
      row.value.version.charCodeAt(), row.value.ownerAddr,
      row.value.isAlgoBuyEscrow ? 22045503 : 22045522,
      row.value.isAlgoBuyEscrow);
    if (isRealContract) {
      realContracts.push(row);
    }
  }
  return realContracts;
}