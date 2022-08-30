#!/usr/bin/env node
/* eslint-disable require-jsdoc */

// IMPORTANT NOTE!!
// This script is now deprecated.
// Please use the /rewards-calc rust script instead.

/* USAGE:
 *
 * This script will calculate all rewards for the epoch and upload them to the
 * database.
 *
 * bin/calculate-rewards --epoch={epoch}
 */

require('dotenv').config();
const cliProgress = require('cli-progress');
const getDatabases = require('../src/db/get-databases');
const getSequenceInfo = require('../src/rewards/get-sequence-info');
const getEpochEnd = require('../src/rewards/get-epoch-end');
const getEpochStart = require('../src/rewards/get-epoch-start');
const getSecondsInEpoch = require('../src/rewards/get-seconds-in-epoch');
const getInitialBalances = require('../src/rewards/get-initial-balances');
// eslint-disable-next-line max-len
// const getOwnerBalanceAtTime = require('../src/rewards/get-owner-balance-at-time');
const getInitialOwnerWalletToBalances =
  require('../src/rewards/get-initial-owner-wallet-to-balances');
// eslint-disable-next-line max-len
const getOwnerBalanceDataToHist = require('../src/rewards/get-owner-balance-data-to-hist');
// eslint-disable-next-line max-len
const getOwnerWalletChangeTimes = require('../src/rewards/get-owner-wallet-change-times');
const updateBalances = require('../src/rewards/update-balances');
const updateOwnerWallets = require('../src/rewards/update-owner-wallets');
const updateRewards = require('../src/rewards/update-rewards');
const updateSpreads = require('../src/rewards/update-spreads');
const getSpreads = require('../src/rewards/get-spreads');
const getEscrowAndTimeToBalance =
    require('../src/rewards/get-escrow-and-time-to-balance.js');


// create a new progress bar instance and use shades_classic theme
const progressBar = new cliProgress.SingleBar({},
    cliProgress.Presets.shades_classic);
const databases = getDatabases();
const formattedEscrowDB = databases.formatted_escrow;
const ownerBalanceDB = databases.owner_balance;

const args = require('minimist')(process.argv.slice(2));
if (args.epoch === undefined) {
  throw new Error('Epoch is missing!');
}
const epoch = parseInt(args.epoch);


let seed = 1;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

async function run() {
  const accountData = await formattedEscrowDB.query('formatted_escrow/epochs', {
    keys: [`${epoch}`]});
  const escrowAddrs = accountData.rows.map(row => row.value);

  const formattedEscrowData =
      await formattedEscrowDB.query('formatted_escrow/orderLookup', {
        keys: escrowAddrs});
  const escrows = formattedEscrowData.rows.map(row => row.value);
  const escrowAddrToData =
    formattedEscrowData.rows.reduce((map, row) => {
      map[row.id] = row.value;
      return map;
    }, {});

  const assetIdToEscrow = Object.keys(escrowAddrToData)
      .reduce((assetIdToEscrow, escrow) => {
        const assetId = escrowAddrToData[escrow].data.escrowInfo.assetId;
        if (!assetIdToEscrow.has(assetId)) {
          assetIdToEscrow.set(assetId, []);
        }

        const arr = assetIdToEscrow.get(assetId);
        arr.push(escrow);

        return assetIdToEscrow;
      }, new Map());
  const ownerWallets =
    escrows.map( escrow => escrow.data.escrowInfo.ownerAddr);
  const ownerBalanceData =
    await ownerBalanceDB.query('owner_balance/ownerAddr', {
      keys: ownerWallets});


  const {unixTimeToChangedEscrows, changedEscrowSeq} = getSequenceInfo(escrows);
  const escrowTimeToBalance = getEscrowAndTimeToBalance(escrows);
  const epochStart = getEpochStart(epoch);
  const epochEnd = process.env.FASTMODE ?
    epochStart + (60*60*24) : getEpochEnd(epoch);
  const ownerBalanceToHist = await getOwnerBalanceDataToHist(ownerBalanceData);
  const {ownerChangeTimes, timeToChangedOwners} =
      getOwnerWalletChangeTimes(ownerBalanceToHist);
  const allAssetsSet = Object.keys(escrowAddrToData).reduce((set, escrow) => {
    const asset = escrowAddrToData[escrow].data.escrowInfo.assetId;
    set.add(asset);
    return set;
  }, new Set());
  const allAssets = Array.from(allAssetsSet);
  console.time('doSomething');

  const initialState = {
    allAssets,
    accountData,
    assetIdToEscrow,
    changedEscrowSeq,
    escrows,
    escrowAddrs,
    escrowAddrToData,
    escrowTimeToBalance,
    epochEnd,
    epochStart,
    formattedEscrowData,
    ownerBalanceData,
    ownerBalanceToHist,
    ownerChangeTimes, timeToChangedOwners,
    ownerWallets,
    unixTimeToChangedEscrows,
  };
  progressBar.start(epochEnd-epochStart, 0);

  Object.freeze(initialState);

  let timestep = epochStart;
  let escrowstep = 0;
  let ownerstep = 0;
  console.log(timestep);
  console.log(epochEnd);

  // State machine data
  const escrowToBalance = getInitialBalances(timestep, escrows);
  const ownerWalletToALGXBalance = getInitialOwnerWalletToBalances(timestep,
      ownerBalanceToHist);
  const ownerWalletAssetToRewards = {};
  const spreads = getSpreads({escrowToBalance, escrowAddrToData});

  const stateMachine = {
    escrowToBalance,
    ownerWalletToALGXBalance,
    ownerWalletAssetToRewards,
    spreads,
  };

  do {
    const curMinute = Math.floor(timestep / 60);
    timestep = ((curMinute + 1) * 60) + Math.round(random()*60);
    let escrowDidChange = false;
    const ownerWalletsBalanceChangeSet = new Set();

    while (escrowstep < changedEscrowSeq.length &&
          changedEscrowSeq[escrowstep] <= timestep) {
      const changeTime = changedEscrowSeq[escrowstep];
      while (ownerstep <= ownerChangeTimes.length &&
        changeTime >= ownerChangeTimes[ownerstep]) {
        // eslint-disable-next-line max-len
        const timeKey = 'time:'+ownerChangeTimes[ownerstep];
        timeToChangedOwners[timeKey].forEach( addr => {
          ownerWalletsBalanceChangeSet.add(addr);
        });
        ownerstep++; // Catch up to escrow time step
      }
      const changedEscrows = unixTimeToChangedEscrows[`ts:${changeTime}`];
      escrowDidChange = true;
      updateBalances({changedEscrows, changeTime,
        ...stateMachine, ...initialState});
      escrowstep++;
    }
    if (ownerWalletsBalanceChangeSet.size > 0) {
      updateOwnerWallets({ownerWalletsBalanceChangeSet,
        ...stateMachine, ...initialState, timestep});
    }
    if (escrowDidChange) {
      updateSpreads(stateMachine, {...initialState});
    }
    const assetsWithBalances =
      Object.keys(escrowToBalance).reduce( (set, escrow) => {
        const assetId = escrowAddrToData[escrow].data.escrowInfo.assetId;
        set.add(assetId);
        return set;
      }, new Set());
    Array.from(assetsWithBalances).forEach(assetId => {
      updateRewards({assetId, ...stateMachine, ...initialState});
    });
    console.log((timestep - epochStart) / (epochEnd - epochStart) * 100);
    // progressBar.update((timestep - epochStart) / (epochEnd - epochStart) * 100);
    progressBar.update(timestep-epochStart);
    // console.log(changedEscrowSet);
  } while (timestep < epochEnd);

  const rewardFinals =
  Object.keys(ownerWalletAssetToRewards).map(ownerWallet => {
    return Object.values(ownerWalletAssetToRewards[ownerWallet])
        .reduce((qualityEntry, assetQualityEntry) => {
          const {qualitySum, depth, uptime} = assetQualityEntry;
          const algxAvg = assetQualityEntry.algxBalanceSum /
            getSecondsInEpoch();
          const qualityFinal = (qualitySum ** 0.5) *
            (uptime ** 5) * (depth ** 0.3); // (algxAvg ** 0.2) * FIXME FOR MAINNET
          qualityEntry.uptime += uptime;
          qualityEntry.qualitySum += qualitySum;
          qualityEntry.depthSum += depth;
          qualityEntry.algxAvg += algxAvg /
            Object.keys(ownerWalletAssetToRewards[ownerWallet]).length;
          qualityEntry.qualityFinal += qualityFinal;
          return qualityEntry;
        }, {ownerWallet, uptime: 0, depthSum: 0,
          qualitySum: 0, algxAvg: 0, qualityFinal: 0});
  });
  rewardFinals.sort((a, b) => a.qualityFinal < b.qualityFinal ? 1 : -1);
  console.log(rewardFinals);
  console.timeEnd('doSomething');
}

run();
