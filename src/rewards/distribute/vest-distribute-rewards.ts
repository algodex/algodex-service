import algosdk, { SuggestedParams } from 'algosdk';
import JSONRequest from 'algosdk/dist/types/src/client/v2/jsonrequest';
import { PouchDB } from '../../algx-types';
import { VestedRewards } from '../../schema/db/vested_rewards';
import { Rewards } from '../../schema/db/rewards';
const withDbSchemaCheck = require('../../schema/with-db-schema-check');
// const { schema, DistributeRewardsInput } = require('./vest-distribute-rewards-schema');
import {schema, DistributeRewardsInput} from './vest-distribute-rewards-schema';
const getDatabases = require('../../db/get-databases');


const databases = getDatabases();

const getAlgxBalance =
  require('../../../services/owner-balance-worker/getAlgxBalance');
const cliProgress = require('cli-progress');
const Ajv = require('ajv');


const getEpochKey = (accrualNetwork, epoch) => {
  return `${accrualNetwork}:${epoch}`;
};

// export interface DistributeRewardsInput {
//   algodClient: algosdk.Algod,
//   rewardsDB: PouchDB,
//   wallets: Array<string>,
//   epoch: number,
//   distributeNetwork: string,
//   accrualNetwork: string,
//   fromAccount: algosdk.Account,
//   sendAssetId: number,
//   indexer: algosdk.Indexer,
// }

interface RewardsKey {
  ownerWallet: string,
  assetId: number,
  epoch: number
}


const getPlannedDistributions = async (input:DistributeRewardsInput): Promise<Array<PlannedDistribution>> => {
  const rewardsDB:PouchDB = databases.rewards;
  const vestedRewardsDB:PouchDB = databases.vested_rewards;

  const allRewardsDocs:Array<Rewards> = (await rewardsDB.allDocs({include_docs: true})).rows.map(row => row.doc);
  const allVestedRewardsDocs:Array<VestedRewards> = (await vestedRewardsDB.allDocs({include_docs: true})).rows.map(row => row.doc);

  // const allRewardsKeys:Array<RewardsKey> = allRewardsDocs.map(doc => <RewardsKey>doc);

  const allVestedRewardKeySet = allVestedRewardsDocs.reduce((set, vestedEntry) => {
    const key:RewardsKey = <RewardsKey>vestedEntry;
    set.add(key);
    return set;
  }, new Set<RewardsKey>);

  return allRewardsDocs.filter(rewardsDoc => {
    const key = <RewardsKey>rewardsDoc;
    return !allVestedRewardKeySet.has(key);
  }).map(rewardsDoc => {
    const plannedSend:PlannedDistribution = {
      algodClient: input.algodClient,
      toWalletAddr: rewardsDoc.ownerWallet,
      amount: rewardsDoc.earnedRewards,
      epoch: rewardsDoc.epoch,
      accrualNetwork: 'mainnet',
      fromAccount: input.fromAccount,
      assetId: input.sendAssetId
    };
    return plannedSend;
  });
}

interface SendRewardsObject {
  algodClient: algosdk.Algod,
  toWalletAddr: string,
  amount: number,
  epoch: number,
  accrualNetwork: string,
  fromAccount: algosdk.Account,
  assetId: number,
}

type PlannedDistribution = SendRewardsObject; 

const sendRewards = async (input: SendRewardsObject) => {
  const {fromAccount, toWalletAddr, amount,
    algodClient, accrualNetwork, epoch, assetId} = input;
  const params:SuggestedParams = await ((algodClient.getTransactionParams()) as unknown as JSONRequest).do() as SuggestedParams;
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
    await (algodClient.sendRawTransaction(rawSignedTxn) as unknown as JSONRequest).do();
    return {result: 'success'};
  } catch (e) {
    return {result: 'failure', error: e.response.text};
  }
};

// /**
//  *
//  * @param {Object} input
//  * @param {Number} input.epoch
//  * @param {String} input.accrualNetwork
//  * @param {Object} input.rewardsDB
//  * @return {Promise} promise
//  */
// const getPastDistributionsAccountsSet =
//   async ({rewardsDB:PouchDB, accrualNetwork:string, epoch:number}) => {
//     const epochKey = getEpochKey(accrualNetwork, epoch);

//     const accountData =
//     await rewardsDB.query('rewards_distribution/rewards_distribution', {
//       keys: [epochKey]});
//     const wallets = accountData.rows
//         .map(row => row.value)
//         .filter(row => row.result === 'success')
//         .map(row => row.to_wallet);
//     const pastDistributionsSet = new Set(wallets);
//     return pastDistributionsSet;
//   };



const distributeRewards = async (input:DistributeRewardsInput) => {
  // const {epoch, distributeNetwork, algodClient, indexer,
  //   rewardsDB, wallets, fromAccount, accrualNetwork, sendAssetId} = input;
  // const ajv = new Ajv();
  // const valid = ajv.validate(schema, input);
  // if (!valid) {
  //   throw new Error('Invalid input to distributeRewards! ' +
  //     JSON.stringify(ajv.errors));
  // }

  // const accountInfo = await indexer.lookupAccountByID(fromAccount.addr)
  //     .includeAll(true).do();

  // const algxBalance = getAlgxBalance(accountInfo);
  // const algoBalance = accountInfo.account.amount;
  // console.log('Wallet balances: ', {algxBalance, algoBalance});
  // const totalNeededAlgx = wallets.length * amount;
  // const totalNeededAlgo = wallets.length * 1000;
  // if (totalNeededAlgx > algxBalance) {
  //   // eslint-disable-next-line max-len
  //   throw new Error(`Not enough ALGX in wallet! ${totalNeededAlgx} vs ${algxBalance}`);
  // }
  // if (totalNeededAlgo > algoBalance) {
  //   // eslint-disable-next-line max-len
  //   throw new Error(`Not enough ALGO in wallet! ${totalNeededAlgo} vs ${algoBalance}`);
  // }

  // const pastDistAccountSet =
  //   await getPastDistributionsAccountsSet({rewardsDB, accrualNetwork, epoch});
  // console.log(pastDistAccountSet);
  // const epochKey = getEpochKey(accrualNetwork, epoch);

  // const progressBar =
  //   new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  // progressBar.start(wallets.length, 1);

  // for (let i = 0; i < wallets.length; i++) {
  //   if (globalThis.isGloballyShuttingDown) {
  //     console.log('\nShutting down early from control+c signal');
  //     process.exit(0);
  //   }
  //   const toWalletAddr = wallets[i];
  //   progressBar.update(i);
  //   if (pastDistAccountSet.has(toWalletAddr)) {
  //     // console.error(`Already sent to ${toWalletAddr}, skipping!`);
  //     continue;
  //   }
  //   const result = await sendRewards({fromAccount, toWalletAddr, amount,
  //     algodClient, accrualNetwork, epoch, assetId});
  //   // eslint-disable-next-line camelcase
  //   const unix_time = Math.round((new Date()).getTime() / 1000);
  //   // eslint-disable-next-line camelcase
  //   const id = `${toWalletAddr}:${epochKey}:${unix_time}`;
  //   const dbItem = {
  //     to_wallet: toWalletAddr,
  //     amount,
  //     assetId,
  //     epoch,
  //     accrualNetwork,
  //     network,
  //     // eslint-disable-next-line camelcase
  //     unix_time,
  //     from_wallet: fromAccount.addr,
  //     result: result.result,
  //     _id: id,
  //   };
  //   if (result.error) {
  //     dbItem.error = result.error;
  //     if (!dbItem.error.includes('missing from')) {
  //       console.error(dbItem.error);
  //     }
  //   }
  //   try {
  //     await rewardsDB.post(withDbSchemaCheck('rewards_distribution', dbItem));
  //   } catch (e) {
  //     console.error(e);
  //     console.error('Attempted to save: ' + JSON.stringify(dbItem));
  //     break;
  //   }
  // }
  // progressBar.update(wallets.length);
  // console.log('\nFinished sending!');
  // process.exit(0);
};

export { distributeRewards, getPlannedDistributions };