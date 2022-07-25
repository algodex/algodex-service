const algosdk = require('algosdk');
const {isConstructSignatureDeclaration} = require('typescript');
const withDbSchemaCheck = require('../../schema/with-db-schema-check');

/**
 *
 * @param {Object} input
 * @param {Object} input.algodClient
 * @param {Object} input.rewardsDB
 * @param {Array.<String>} input.wallets
 * @param {Number} input.amount
 * @param {Number} input.epoch
 * @param {String} input.network
 * @param {String} input.accrualNetwork
 * @param {Object} input.fromAccount
 * @param {Object} input.assetId
 */
const distributeRewards = async ({epoch, network, algodClient, rewardsDB,
  wallets, amount, fromAccount, accrualNetwork, assetId}) => {
  if (typeof(amount) !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error('amount is not a valid number!');
  }
  if (!Array.isArray(wallets)) {
    throw new Error('wallets is not an array!');
  }
  if (!network || !(network === 'testnet' || network === 'mainnet')) {
    throw new Error('network not well defined: ' + network);
  }

  const pastDistAccountSet =
    await getPastDistributionsAccountsSet({rewardsDB, accrualNetwork, epoch});

  const epochKey = getEpochKey(accrualNetwork, epoch);
  for (let i = 0; i < wallets.length; i++) {
    const toWalletAddr = wallets[i];
    if (pastDistAccountSet.has(toWalletAddr)) {
      console.log(`Already sent to ${toWalletAddr}, skipping!`);
      continue;
    }
    const result = await sendRewards({fromAccount, toWalletAddr, amount,
      algodClient, accrualNetwork, epoch, assetId});
    // eslint-disable-next-line camelcase
    const unix_time = Math.round((new Date()).getTime() / 1000);
    const id = `${toWalletAddr}:${epochKey}`;
    const dbItem = {
      to_wallet: toWalletAddr,
      amount,
      assetId,
      epoch,
      accrualNetwork,
      network,
      // eslint-disable-next-line camelcase
      unix_time,
      from_wallet: fromAccount.addr,
      result: result.result,
      _id: id,
    };
    if (result.error) {
      dbItem.error = result.error;
    }
    console.log({dbItem});
    try {
      await rewardsDB.post(withDbSchemaCheck('rewards_distribution', dbItem));
    } catch (e) {
      console.error(e);
      break;
    }
  }
  console.log(pastDistAccountSet);
};

const getEpochKey = (accrualNetwork, epoch) => {
  return `${accrualNetwork}:${epoch}`;
};

const sendRewards = async ({fromAccount, toWalletAddr, amount,
  algodClient, accrualNetwork, epoch, assetId}) => {
  const params = await algodClient.getTransactionParams().do();
  const epochKey = getEpochKey(accrualNetwork, epoch);
  const enc = new TextEncoder();
  const note = enc.encode('ALGX Rewards Distribution:' + epochKey);
  const xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      fromAccount.addr,
      toWalletAddr,
      undefined,
      undefined,
      amount,
      note,
      assetId,
      params);
    // Must be signed by the account sending the asset
  const rawSignedTxn = xtxn.signTxn(fromAccount.sk);
  try {
    await algodClient.sendRawTransaction(rawSignedTxn).do();
    return {result: 'success'};
  } catch (e) {
    return {result: 'failure', error: e};
  }
};

const getPastDistributionsAccountsSet =
  async ({rewardsDB, accrualNetwork, epoch}) => {
    const epochKey = getEpochKey(accrualNetwork, epoch);

    const accountData =
    await rewardsDB.query('rewards_distribution/rewards_distribution', {
      keys: [epochKey]});
    const wallets = accountData.rows
        .map(row => row.value)
        .filter(row => row.result === 'success')
        .map(row => row.to_wallet);
    const pastDistributionsSet = new Set(wallets);
    return pastDistributionsSet;
  };

module.exports = distributeRewards;

