// const compile = require('@algodex/algodex-sdk/lib/order/compile');
const {
  withOrderbookEntry,
  withLogicSigAccount,
} = require('@algodex/algodex-sdk/lib/order/compile');
const algosdk = require('algosdk');
const withSchemaCheck = require('../src/schema/with-db-schema-check');

// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
/**
*  check if value is interger
*  @param {number} value pass as parameter
*  @return boolean value true if value is integer
*  @return {boolean} true if value is integer other
*/
function isInt(value) {
  if (isNaN(value)) {
    return false;
  }

  const x = parseFloat(value);
  return (x | 0) === x;
}

const checkAndGetInput = (
    escrowAddress,
    orderEntry, version, ownerAddress, appId, isAlgoBuyEscrow) => {
  const orderSplit = orderEntry.split('-');
  // rec contains the original order creators address
  const assetLimitPriceN = parseInt(orderSplit[0]);
  const assetLimitPriceD = parseInt(orderSplit[1]);
  // const minimumExecutionSizeInAlgo = orderSplit[2];
  const assetId = parseInt(orderSplit[3]);

  version = version.charCodeAt(0);

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
  if (
    !isInt(version) || version <= 2 || version >= 8
  ) { // FIXME - figure out max version from SDK
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
      'id': assetId,
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

const verifyContract = async (
    escrowAddress,
    orderEntry, version, ownerAddress, appId, isAlgoBuyEscrow) => {
  let input = null;
  try {
    input = checkAndGetInput(
        escrowAddress,
        orderEntry, version, ownerAddress, appId, isAlgoBuyEscrow);
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

module.exports = async (rows, verifiedAccountDB) => {
  const realContracts = [];

  const accounts = rows.map((row) => row.key[0]);

  const result = await verifiedAccountDB.query('verified_account/verifiedAddr',
      {reduce: false, keys: accounts});

  const isVerifiedSet =
    result.rows
        .filter( (row) => row.value === 'verified')
        .reduce( (set, row) => set.add(row.id), new Set());

  const verifDBHasAddrSet = result.rows
      .reduce( (set, row) => set.add(row.id), new Set());

  const rowsToAddtoDB = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const account = row.key[0];
    const isRealContract = isVerifiedSet.has(account) ||
      await verifyContract(account, row.value.orderInfo,
          row.value.version, row.value.ownerAddr,
          // FIXME - use env variables
          row.value.isAlgoBuyEscrow ? 22045503 : 22045522,
          row.value.isAlgoBuyEscrow);
    if (isRealContract) {
      realContracts.push(row);
    } else {
      console.log('fake contract found? ' + account);
    }

    if (!verifDBHasAddrSet.has(account)) {
      rowsToAddtoDB.push(withSchemaCheck('verified_account', {
        _id: account,
        status: isRealContract ? 'verified' : 'fake',
        version: row.value.version,
      }));
    }
  }

  try {
    await verifiedAccountDB.bulkDocs(rowsToAddtoDB);
  } catch (e) {
    console.error('could not bulk add accounts to verified DB');
    console.error(e);
    throw e;
  }
  return realContracts;
};
