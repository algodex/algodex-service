/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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

type RewardsKey = string;

interface SendRewardsObject {
  algodClient: algosdk.Algod,
  toWalletAddr: string,
  amount: number,
  epoch: number,
  accrualNetwork: string,
  fromAccount: algosdk.Account,
  accrualAssetId: number,
  sentAssetId: number
}

type PlannedDistribution = SendRewardsObject; 

type SendSuccessOrFail = 'success' | 'failure';

interface SendRewardsResult {
  result:SendSuccessOrFail,
  distribution:SendRewardsObject,
  error?:string,
  transactionId?:string
}

const distributeRewards = async (input:DistributeRewardsInput) => {
  const plannedDistributions = await getPlannedDistributions(input);

  const isDryRun = input.dryRunWithDBSave === true || input.dryRunNoSave === true;
  const saveToDB = !(input.dryRunNoSave === true);

  console.log({isDryRun});
  
  if (!isDryRun) {
    await checkHasNeededAlgx(input.fromAccount, input.indexer, plannedDistributions);
  }

  if (isDryRun && input.removeOldFirst === true) {
    console.log("Going to delete all old records from vested_rewards");
    const db = databases.vested_rewards;
    const allDocs = await db.allDocs();
    console.log(allDocs.rows.filter(row => row.id.includes(":")).length + " docs to delete");
    const deletePromises = allDocs.rows
      .filter(row => row.id.includes(":"))
      .map(row => {
        console.log("sending remove for: ", {id: row.id});
       return db.get(row.id).then(doc => db.remove(doc))
        .then(console.log("removed "+row.id)).catch(e => console.log("failed to remove " + row.id, e))
      });
    await Promise.allSettled(deletePromises);
  }

  // console.log({plannedDistributions});

  for (let i = 0; i < plannedDistributions.length; i++) {
    const distribution = plannedDistributions[i];
    console.log(`${i}/${plannedDistributions.length}`, {distribution})
    if (!isDryRun) {
      console.log("REAL sending ALGX rewards!")
      await sendRewards(distribution).then(res => addDistributionToDB(res.result, "vested_rewards", res.distribution,
        res.transactionId, true, res.error));
    } else {
      console.log("FAKE sending ALGX rewards!")
      await fakeSendRewards(distribution).then(res => addDistributionToDB(res.result, "vested_rewards", res.distribution,
        res.transactionId, saveToDB, res.error));
    }
  };
}

const addDistributionToDB = async(result:string, dbName: string, distribution: SendRewardsObject, transactionId: string,
    saveToDB:boolean, error?: string) => {
  const vestedUnixTime = Math.round((new Date()).getTime() / 1000);

  const {
    toWalletAddr, amount, epoch, fromAccount, accrualAssetId, sentAssetId
  } = distribution;
    // eslint-disable-next-line camelcase
  const id = `${toWalletAddr}:${epoch}:${accrualAssetId}:${vestedUnixTime}`;
    const dbItem:VestedRewards = {
      ownerWallet: toWalletAddr,
      vestedRewards: amount,
      formattedVestedRewards: amount / (10**6),
      sentAssetId,
      accrualAssetId,
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
      if (saveToDB) {
        await databases[dbName].post(withDbSchemaCheck(dbName, dbItem));
      } else {
        console.log('skipping save to DB due to dry run config!');
      }
    } catch (e) {
      console.error(e);
      console.error('Attempted to save: ' + JSON.stringify(dbItem));
    }
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

  console.log('TOTAL NEEDED: ' + totalNeededAlgo);
  return true;
};


const getPlannedDistributions = async (input:DistributeRewardsInput): Promise<Array<PlannedDistribution>> => {
  const rewardsDB:PouchDB = databases.rewards;
  const vestedRewardsDB:PouchDB = databases.vested_rewards;

  const allRewardsDocs:Array<Rewards> = (await rewardsDB.allDocs({include_docs: true})).rows.map(row => row.doc);
  const allVestedRewardsDocs:Array<VestedRewards> = (await vestedRewardsDB.allDocs({include_docs: true})).rows.map(row => row.doc);

  const allVestedRewardKeySet = allVestedRewardsDocs.reduce((set, vestedEntry) => {
    const {ownerWallet, accrualAssetId, epoch} = vestedEntry;
    const key:RewardsKey = `${ownerWallet};${accrualAssetId};${epoch}`;

    if (vestedEntry.result === 'success') {
      // If already sent rewards and it was a successful transaction
      set.add(key);
    }
    return set;
  }, new Set<RewardsKey>);

  return allRewardsDocs.filter(rewardsDoc => {
    const {ownerWallet, accrualAssetId, epoch} = rewardsDoc;
    const key:RewardsKey = `${ownerWallet};${accrualAssetId};${epoch}`;
    return !allVestedRewardKeySet.has(key);
  })
  .filter(rewardsDoc => rewardsDoc.earnedRewardsFormatted >= 1)
  .filter(rewardsDoc => rewardsDoc.epoch > 38) // Ignore earlier failed transactions
  .map(rewardsDoc => {
    const plannedSend:PlannedDistribution = {
      algodClient: input.algodClient,
      toWalletAddr: rewardsDoc.ownerWallet,
      amount: Math.round(rewardsDoc.earnedRewardsFormatted * 10**6),
      epoch: rewardsDoc.epoch,
      accrualNetwork: 'mainnet',
      fromAccount: input.fromAccount,
      sentAssetId: input.sendAssetId,
      accrualAssetId: rewardsDoc.accrualAssetId
    };
    return plannedSend;
  });
}


const sendRewards = async (input: SendRewardsObject):Promise<SendRewardsResult> => {
  const {fromAccount, toWalletAddr, amount,
    algodClient, accrualNetwork, epoch, sentAssetId} = input;
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
      sentAssetId,
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
    algodClient, accrualNetwork, epoch, accrualAssetId: assetId} = input;
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