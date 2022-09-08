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

interface RewardsKey {
  ownerWallet: string,
  assetId: number,
  epoch: number
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

type SendSuccessOrFail = 'success' | 'failure';

interface SendRewardsResult {
  result:SendSuccessOrFail,
  distribution:SendRewardsObject,
  error?:string,
  transactionId?:string
}


const addDistributionToDB = async(result:string, distribution: SendRewardsObject, transactionId: string, error?: string) => {
  const vestedUnixTime = Math.round((new Date()).getTime() / 1000);

  const {
    algodClient, toWalletAddr, amount, epoch, accrualNetwork, fromAccount, assetId,
  } = distribution;
    // eslint-disable-next-line camelcase
  const id = `${toWalletAddr}:${epoch}:${assetId}:${vestedUnixTime}`;
    const dbItem:VestedRewards = {
      ownerWallet: toWalletAddr,
      vestedRewards: amount,
      formattedVestedRewards: amount / (10**6),
      assetId,
      epoch,
      vestedUnixTime,
      fromWallet: fromAccount.addr,
      result: result,
      transactionId,
      _id: id,
    };
    if (error) {
      dbItem.error = error;
      if (!dbItem.error.includes('missing from')) {
        console.error(dbItem.error);
      }
    }
    try {
      await databases.vested_rewards.post(withDbSchemaCheck('rewards_distribution', dbItem));
    } catch (e) {
      console.error(e);
      console.error('Attempted to save: ' + JSON.stringify(dbItem));
    }
}

const distributeRewards = async (input:DistributeRewardsInput) => {
  const plannedDistributions = await getPlannedDistributions(input);

  const isDryRun = input.dryRunWithDBSave === true;
  console.log({isDryRun});
  
  if (isDryRun) {
    await checkHasNeededAlgx(input.fromAccount, input.indexer, plannedDistributions);
  }

  const sendPromises = plannedDistributions.map(distribution => {
    if (!isDryRun) {
      sendRewards(distribution).then(res => addDistributionToDB(res.result, res.distribution, res.error));
    } else {
      fakeSendRewards(distribution).then(res => addDistributionToDB(res.result, res.distribution, res.error));
    }
  });

  await Promise.all(sendPromises);
}

const checkHasNeededAlgx = async (fromAccount:algosdk.Account, indexer:algosdk.Indexer,
  plannedDistributions:Array<PlannedDistribution>):Promise<boolean> => {
  const accountInfo = await indexer.lookupAccountByID(fromAccount.addr)
      .includeAll(true).do();

  const algxBalance = getAlgxBalance(accountInfo);

  const totalNeededAlgx = plannedDistributions.reduce((sum, entry) => sum += entry.amount, 0);
  const algoBalance = accountInfo.account.amount;
  console.log('Wallet balances: ', {algxBalance, algoBalance});
  const totalNeededAlgo = plannedDistributions.length * 1000;
  if (totalNeededAlgx > algxBalance) {
    // eslint-disable-next-line max-len
    throw new Error(`Not enough ALGX in wallet! ${totalNeededAlgx} vs ${algxBalance}`);
  }
  if (totalNeededAlgo > algoBalance) {
    // eslint-disable-next-line max-len
    throw new Error(`Not enough ALGO in wallet! ${totalNeededAlgo} vs ${algoBalance}`);
  }
  return true;
};


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


const sendRewards = async (input: SendRewardsObject):Promise<SendRewardsResult> => {
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
    const sendResult = await (algodClient.sendRawTransaction(rawSignedTxn) as unknown as JSONRequest).do();
    return {result: 'success', distribution: input, transactionId: sendResult.txId};
  } catch (e) {
    return {result: 'failure', distribution: input, error: e.response.text};
  }
};

const fakeSendRewards = async (input: SendRewardsObject):Promise<SendRewardsResult> => {
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
  return {result: 'success', distribution: input, transactionId: '52HZEYOBLKYT6C3IA35TVRVZL4H562JTYPLNTVRD6CTTRNRUXR6A'};
};


export { distributeRewards, getPlannedDistributions };