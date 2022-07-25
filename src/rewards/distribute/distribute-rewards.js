const algosdk = require('algosdk');
const withDbSchemaCheck = require('../../schema/with-db-schema-check');
const getAlgxBalance =
  require('../../../services/owner-balance-worker/getAlgxBalance');
const cliProgress = require('cli-progress');
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
 * @param {Number} input.assetId
 * @param {Object} input.indexer
 * @return {Promise} promise
 */
const distributeRewards = async ({epoch, network, algodClient, indexer,
  rewardsDB, wallets, amount, fromAccount, accrualNetwork, assetId}) => {
  if (typeof(amount) !== 'number' || isNaN(amount) || amount <= 0) {
    throw new Error('amount is not a valid number!');
  }
  if (!Array.isArray(wallets)) {
    throw new Error('wallets is not an array!');
  }
  if (!network || !(network === 'testnet' || network === 'mainnet')) {
    throw new Error('network not well defined: ' + network);
  }

  const accountInfo = await indexer.lookupAccountByID(fromAccount.addr)
      .includeAll(true).do();

  const algxBalance = getAlgxBalance(accountInfo);
  const algoBalance = accountInfo.account.amount;
  console.log('Wallet balances: ', {algxBalance, algoBalance});
  const totalNeededAlgx = wallets.length * amount;
  const totalNeededAlgo = wallets.length * 1000;
  if (totalNeededAlgx > algxBalance) {
    // eslint-disable-next-line max-len
    throw new Error(`Not enough ALGX in wallet! ${totalNeededAlgx} vs ${algxBalance}`);
  }
  if (totalNeededAlgo > algoBalance) {
    throw new Error(`Not enough ALGO in wallet!
      ${totalNeededAlgo} vs ${algoBalance}`);
  }

  const pastDistAccountSet =
    await getPastDistributionsAccountsSet({rewardsDB, accrualNetwork, epoch});
  console.log(pastDistAccountSet);
  const epochKey = getEpochKey(accrualNetwork, epoch);

  const progressBar =
    new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(wallets.length, 1);

  for (let i = 0; i < wallets.length; i++) {
    if (globalThis.isGloballyShuttingDown) {
      console.log('\nShutting down early from control+c signal');
      process.exit(0);
    }
    const toWalletAddr = wallets[i];
    progressBar.update(i);
    if (pastDistAccountSet.has(toWalletAddr)) {
      // console.error(`Already sent to ${toWalletAddr}, skipping!`);
      continue;
    }
    const result = await sendRewards({fromAccount, toWalletAddr, amount,
      algodClient, accrualNetwork, epoch, assetId});
    // eslint-disable-next-line camelcase
    const unix_time = Math.round((new Date()).getTime() / 1000);
    // eslint-disable-next-line camelcase
    const id = `${toWalletAddr}:${epochKey}:${unix_time}`;
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
      if (!dbItem.error.includes('missing from')) {
        console.error(dbItem.error);
      }
    }
    try {
      await rewardsDB.post(withDbSchemaCheck('rewards_distribution', dbItem));
    } catch (e) {
      console.error(e);
      console.error('Attempted to save: ' + JSON.stringify(dbItem));
      break;
    }
  }
  progressBar.update(wallets.length);
  console.log('\nFinished sending!');
  process.exit(0);
};

const getEpochKey = (accrualNetwork, epoch) => {
  return `${accrualNetwork}:${epoch}`;
};

/**
 *
 * @param {Object} input
 * @param {Object} input.algodClient
 * @param {Number} input.amount
 * @param {Number} input.epoch
 * @param {String} input.accrualNetwork
 * @param {Object} input.fromAccount
 * @param {Number} input.assetId
 * @param {String} input.toWalletAddr
 * @return {Promise} promise
 */
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
    return {result: 'failure', error: e.response.text};
  }
};

/**
 *
 * @param {Object} input
 * @param {Number} input.epoch
 * @param {String} input.accrualNetwork
 * @param {Object} input.rewardsDB
 * @return {Promise} promise
 */
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

