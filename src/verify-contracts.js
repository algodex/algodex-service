const compile = require('@algodex/algodex-sdk/lib/order/compile');
const { withOrderbookEntry, withLogicSigAccount } = require('@algodex/algodex-sdk/lib/order/compile');
const algosdk = require('algosdk');

// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
function isInt(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
}

const checkAndGetInput = (escrowAddress, orderEntry, version, ownerAddress, appId, isAlgoBuyEscrow) => {
  const orderSplit = orderEntry.split("-");
  // rec contains the original order creators address
  const assetLimitPriceN = parseInt(orderSplit[0]);
  const assetLimitPriceD = parseInt(orderSplit[1]);
  //const minimumExecutionSizeInAlgo = orderSplit[2];
  const assetId = parseInt(orderSplit[3]);

  if (typeof escrowAddress !== 'string') {
    throw new TypeError('escrowAddress is not string!`');
  }
  if (!isInt(assetId) || assetId < 0) {
    throw new TypeError('invalid assetId!');
  }
  if (typeof isAlgoBuyEscrow !== 'boolean') {
    throw new TypeError('invalid isAlgoBuyEscrow!');
  }
  if (typeof ownerAddress !== 'string' || ownerAddress.length == 0) {
    throw new TypeError('invalid ownerAddress!');
  }
  if (!isInt(appId) || appId < 0) {
    throw new TypeError('invalid appId!');
  }
  if (!isInt(version) || version <= 2 || version >= 8) { //FIXME - figure out max version from SDK
    throw new TypeError('invalid appId!');
  }
  if (!isInt(assetLimitPriceN) || assetLimitPriceN <= 0) {
    throw new TypeError('invalid assetLimitPriceN!');
  }
  if (!isInt(assetLimitPriceD) || assetLimitPriceD <= 0) {
    throw new TypeError('invalid assetLimitPriceD!');
  }

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


  return input;
};

const verifyContract = async (escrowAddress, orderEntry, version, ownerAddress, appId, isAlgoBuyEscrow) => {

  let input = null;
  try {
    input = checkAndGetInput(escrowAddress, orderEntry, version, ownerAddress, appId, isAlgoBuyEscrow);
  } catch (e) {
    console.log('Invalid input!');
    return false;
  }
  if (!input) {
    return false;
  }
  input.client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http://ec2-3-18-80-65.us-east-2.compute.amazonaws.com', 8080 ); // FIXME - use env variables or pass in client

  const compiledOrder = await withLogicSigAccount(withOrderbookEntry(input));
  if (escrowAddress === compiledOrder?.contract?.escrow) {
    return true;
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
      row.value.isAlgoBuyEscrow ? 22045503 : 22045522, // FIXME - use env variables
      row.value.isAlgoBuyEscrow);
    if (isRealContract) {
      realContracts.push(row);
    }
  }
  return realContracts;
}