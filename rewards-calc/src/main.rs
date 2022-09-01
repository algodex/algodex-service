use dotenv;
use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::{fmt, time};
mod structs;
use structs::{EscrowValue, EscrowTimeKey, AlgxBalanceValue, TinymanTrade};
use crate::quality_type::EarnedAlgx;
use crate::structs::History;
use crate::structs::CouchDBOuterResp;
use crate::update_rewards::OwnerRewardsKey;
use crate::update_rewards::{check_mainnet_period, MainnetPeriod};
use crate::structs::CouchDBResultsType::{Grouped, Ungrouped};
mod query_couch;
mod get_spreads;
mod update_spreads;
mod update_rewards;
mod quality_type;
use update_spreads::updateSpreads;
use update_rewards::{updateRewards, EarnedAlgxEntry};
use get_spreads::getSpreads;
use rand::Rng;
mod save_rewards;
use crate::save_rewards::save_rewards;
use crate::update_rewards::OwnerRewardsResult;
use crate::structs::CouchDBResult;
use query_couch::{query_couch_db,query_couch_db_with_full_str};
// use query_couch::query_couch_db2;
use crate::get_spreads::Spread;
use crate::quality_type::Quality;
use crate::structs::CouchDBGroupedResult;
use urlencoding::encode;
use crate::structs::CouchDBResp;

use std::path::PathBuf;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    #[clap(short, long)]
    epoch: u16,
}


//aaa {"results":[
//{"total_rows":305541,"offset":71,"rows":[
//    {"id":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","key":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","value":{

#[derive(Debug, Clone)]
pub struct PriceData {
  pub unix_time: u32,
  pub price: f64
}

fn getTinymanPricesFromData(tinymanTradesData: CouchDBResp<TinymanTrade>) -> Vec<PriceData> {
  return tinymanTradesData.rows.iter()
  .map(|tradeItem| &tradeItem.value)
  .map(|tradeItem| {
    let time = tradeItem.unix_time;
    let assets = (tradeItem.pool_xfer_asset_id, tradeItem.user_xfer_asset_id); 
    let algoAmount = match assets {
      (1, _) => tradeItem.pool_xfer_amount,
      (_, 1) => tradeItem.user_xfer_amount,
      (_, _) => panic!("Unexpected asset!")
    };
    let usdcAmount = match assets {
      (31566704, _) => tradeItem.pool_xfer_amount,
      (_, 31566704) => tradeItem.user_xfer_amount,
      (_, _) => panic!("Unexpected asset!")
    };

    let price = usdcAmount as f64/algoAmount as f64;
    PriceData {unix_time: time, price}
  }).collect();
}


async fn get_initial_state() -> Result<(InitialState), Box<dyn Error>> {
  let cli = Cli::parse();

  // You can check the value provided by positional arguments, or option arguments
  let EPOCH = cli.epoch;
  println!("Epoch is {EPOCH}");
  if (EPOCH < 1) {
    panic!("Epoch cannot be less than 1!");
  }

  dotenv::from_filename(".env").expect(".env file can't be found!");
  let env = dotenv::vars().fold(HashMap::new(), |mut map, val| {
      map.insert(val.0, val.1);
      map
  });
  // println!("{:?}", result.get("ALGORAND_NETWORK").take());

  let couch_dburl = env.get("COUCHDB_BASE_URL_RUST").expect("Missing COUCHDB_BASE_URL_RUST");
  let keys = [EPOCH.to_string()].to_vec();
  let accountEpochDataQueryRes = query_couch_db::<String>(&couch_dburl,
      &"formatted_escrow".to_string(),
      &"formatted_escrow".to_string(),
      &"epochs".to_string(), &keys, false).await;
  let accountData = match accountEpochDataQueryRes.unwrap().results {
      Ungrouped(val) => val,
      _ => {panic!("Unexpected grouped value for accountEpochDataQueryRes")},
  }.remove(0).rows;
  let escrowAddrs:Vec<String> = accountData.iter().map(|row| String::clone(&row.value)).collect();
  // println!("{:?}", escrowAddrs);
  
  let formattedEscrowDataQueryRes = query_couch_db::<EscrowValue>(&couch_dburl,
      &"formatted_escrow".to_string(),
      &"formatted_escrow".to_string(),
      &"orderLookup".to_string(), &escrowAddrs, false).await;

  let formattedEscrowData = match formattedEscrowDataQueryRes.unwrap().results {
    Ungrouped(val) => val,
    _ => {panic!("Unexpected grouped value for formattedEscrowDataQueryRes")},
  }.remove(0).rows;

  let escrows: Vec<EscrowValue> = formattedEscrowData.iter().map(|row| row.value.clone()).collect();
  let escrowAddrToData:HashMap<String,EscrowValue> = formattedEscrowData.iter().fold(HashMap::new(), |mut map, row| {
          map.insert(row.id.clone(), row.value.clone());
          map
      });
  
  let assetIdToEscrows:HashMap<u32, Vec<String>> = escrowAddrToData.keys().fold(HashMap::new(), |mut map, escrow| {
    let assetId = &escrowAddrToData.get(escrow).unwrap().data.escrow_info.asset_id;
    if !map.contains_key(assetId) {
      map.insert(*assetId, Vec::new());
    }
    let vec = map.get_mut(assetId).unwrap();
    vec.push(escrow.clone());
    map
  });

  //println!("{:?}", escrowAddrToData);

  let ownerWallets: Vec<String> = escrows.iter().map(|escrow| &escrow.data.escrow_info.owner_addr).cloned().collect();

  let algxBalanceDataQueryRes = query_couch_db::<AlgxBalanceValue>(&couch_dburl,
    &"algx_balance".to_string(),
    &"algx_balance".to_string(),
    &"algx_balance".to_string(), &ownerWallets, true).await;
  let mut algxBalanceData = match algxBalanceDataQueryRes.unwrap().results {
    Grouped(val) => val,
    _ => {panic!("Unexpected ungrouped value for formattedEscrowDataQueryRes")},
  }.remove(0).rows;

  algxBalanceData.sort_by(|a, b| a.value.round.partial_cmp(&b.value.round).unwrap());

  let algx_change_rounds_set: HashSet<u32> = algxBalanceData.iter()
    .map(|row| row.value.round)
    .fold(HashSet::new(), |mut set, item| {
      set.insert(item);
      set
    });
  let blocks_vec:Vec<String> = algx_change_rounds_set.iter()
    .map(|round|round.to_string()).collect();

  let blockTimesDataQueryRes = query_couch_db::<u32>(&couch_dburl,
    &"blocks".to_string(),
    &"blocks".to_string(),
    &"blockToTime".to_string(), &blocks_vec, false).await;
  let blockTimesData = match blockTimesDataQueryRes.unwrap().results {
    Ungrouped(val) => val,
    _ => {panic!("Unexpected grouped value for blockTimesDataQueryRes")},
  }.remove(0).rows;
  let blockToUnixTime: HashMap<u32, u32> = blockTimesData.iter().fold(HashMap::new(),|mut map, block| {
    let key = match &block.key {
      structs::CouchDBKey::StringVal(str) => str,
        _ => panic!("Invalid key!")
    }.parse::<u32>().unwrap();
    map.insert(key, block.value);
    map
  });
  // println!("{:?}", blockTimesData);

  let epochLaunchTime = env.get("EPOCH_LAUNCH_UNIX_TIME").unwrap().parse::<u32>().unwrap();
  let epochStart = getEpochStart(EPOCH, epochLaunchTime);
  let epochEnd = getEpochEnd(EPOCH, epochLaunchTime);

  let encode_price_query = |time| -> String {
    let vec = vec![1, 31566704, time];
    let json = serde_json::to_string(&vec).unwrap();
    let encoded = encode(&json.to_string()).into_owned();
    encoded
  };

  let epochStartStr = encode_price_query(epochStart);
  let epochEndStr = encode_price_query(epochEnd);

  let tinymanStr = format!("inclusive_end=true&start_key={}&end_key={}&reduce=false",
  epochStartStr, epochEndStr);
  
  let tinymanTrades = query_couch_db_with_full_str::<TinymanTrade>(&couch_dburl,
    &"blocks".to_string(),
    &"blocks".to_string(),
    &"tinymanTrades".to_string(), &tinymanStr.to_string()).await;
    // dbg!(tinymanTrades.as_ref());

  let tinymanTradesData = tinymanTrades.unwrap();
  let tinymanPrices = getTinymanPricesFromData(tinymanTradesData);

  // dbg!(tinymanPrices);
  // let formatted_escrow_data = query_couch_db::<EscrowValue>(&couch_dburl,
  //     &"formatted_escrow".to_string(),
  //     &"formatted_escrow".to_string(),
  //     &"orderLookup".to_string(), &escrowAddrs).await;

  let (unixTimeToChangedEscrows, changedEscrowSeq) = getSequenceInfo(&escrows);

  let escrowTimeToBalance = getEscrowAndTimeToBalance(&escrows);

    //FIXME - change to read args for epoch
  let allAssetsSet: HashSet<u32> = escrowAddrToData.keys().fold(HashSet::new(), |mut set, escrow| {
      let asset = escrowAddrToData.get(escrow).unwrap().data.escrow_info.asset_id;
      set.insert(asset.clone());
      set
  });
  let allAssets: Vec<u32> = allAssetsSet.clone().into_iter().collect();

  // dbg!(allAssetsSet);
  // let cloned: Vec<CouchDBResult<EscrowValue>> = formattedEscrowDataQueryRes.unwrap().results[0].rows.clone();

  let initialState = InitialState {
      algxBalanceData,
      allAssets,
      allAssetsSet,
      assetIdToEscrows,
      blockToUnixTime,
      changedEscrowSeq,
      epoch: EPOCH,
      epochStart,
      epochEnd,
      epochLaunchTime,
      escrowTimeToBalance,
      tinymanPrices,
      unixTimeToChangedEscrows,
      formattedEscrowData,
      escrowAddrs,
      accountData,
      escrows,
      escrowAddrToData,
  };

  return Ok(initialState);
}


#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {


  let initialState = get_initial_state().await.unwrap();
  let epochStart = initialState.epochStart;
  let epochEnd = initialState.epochEnd;
  let epoch = initialState.epoch;

  //dbg!(initialState);

  let mut timestep = epochStart;

  let mut escrowstep = 0;

  // println!("{} {}", epochStart, epochEnd);

  //state machine data

  let escrowToBalance = getInitialBalances(timestep, &initialState.escrows);
  let spreads = getSpreads(&escrowToBalance, &initialState.escrowAddrToData);

  let ownerWalletAssetToRewards: HashMap<String,HashMap<u32,OwnerRewardsResult>> = HashMap::new();
  let ownerWalletToALGXBalance: HashMap<&String,u64> = HashMap::new();

  let mut stateMachine = StateMachine {
      escrowToBalance,
      ownerWalletToALGXBalance,
      ownerWalletAssetToRewards,
      spreads,
      algoPrice: 0.0,
      timestep
    };

  //dbg!(spreads);

  let mut rng = rand::thread_rng();
  let mut owner_wallet_step = 0;
  let mut algo_price_step = 0;

  loop {
    let curMinute = stateMachine.timestep / 60;
    stateMachine.timestep = ((curMinute + 1) * 60) + rng.gen_range(0..60);
    let mut escrowDidChange = false;
    // let ownerWalletsBalanceChangeSet:HashSet<String> = HashSet::new();
    while (owner_wallet_step < initialState.algxBalanceData.len()) {
      let owner_balance_entry = &initialState.algxBalanceData[owner_wallet_step];
      let owner_wallet_time = getTimeFromRound(&initialState.blockToUnixTime,
          &owner_balance_entry.value.round);
      if (owner_wallet_time > stateMachine.timestep) {
        break;
      }
      let wallet:&String = &owner_balance_entry.key;
      stateMachine.ownerWalletToALGXBalance.insert(wallet, owner_balance_entry.value.balance);
      owner_wallet_step += 1;
    }

    // Price steps
    while (algo_price_step < initialState.tinymanPrices.len()) {
      let price_entry = &initialState.tinymanPrices[algo_price_step];
      if (price_entry.unix_time > stateMachine.timestep) {
        break;
      }
      stateMachine.algoPrice = price_entry.price;
      algo_price_step += 1;
    }

    while (escrowstep < initialState.changedEscrowSeq.len() &&
      initialState.changedEscrowSeq[escrowstep] <= stateMachine.timestep) {
        let changeTime = &initialState.changedEscrowSeq[escrowstep];
        let changedEscrows = initialState.unixTimeToChangedEscrows.get(changeTime).unwrap();
        escrowDidChange = true;
        updateBalances(&changedEscrows, &changeTime,
          &mut stateMachine.escrowToBalance, &initialState.escrowTimeToBalance);
        escrowstep += 1;
    }

    if (escrowDidChange) {
      updateSpreads(&initialState, &mut stateMachine);
    }

    let assetsWithBalances: HashSet<&u32> =
      stateMachine.escrowToBalance.keys().fold(HashSet::new(),|mut set, escrow| {
        let assetId = &initialState.escrowAddrToData.get(escrow).unwrap().data.escrow_info.asset_id;
        set.insert(assetId);
        set
    });

    assetsWithBalances.into_iter().for_each(|assetId| {
      updateRewards(assetId, &mut stateMachine, &initialState);
    });
    // Array.from(assetsWithBalances).forEach(assetId => {
    //   updateRewards({assetId, ...stateMachine, ...initialState});
    // });
    println!("{}", (stateMachine.timestep as f64 - epochStart as f64) / (epochEnd as f64 - epochStart as f64) * 100.0);

    if (stateMachine.timestep >= epochEnd) {
      break;
    }
  }

  // Need to give rewards per asset
  
  let mainnet_period = check_mainnet_period(&epochEnd);

  let mut ownerRewardsResToFinalRewardsEntry:HashMap<OwnerRewardsKey,EarnedAlgxEntry> = HashMap::new();
  let total_quality:f64 = 
  stateMachine.ownerWalletAssetToRewards.keys().fold(0f64, |total_quality, ownerWallet| {
    let ownerAssetEntries = stateMachine.ownerWalletAssetToRewards.get(ownerWallet).unwrap();
    let quality = ownerAssetEntries.keys()
      .fold(0f64, |total_quality, assetId| {
        let assetQualityEntry = ownerAssetEntries.get(assetId).unwrap();
        let OwnerRewardsResult {ref algxBalanceSum, ref qualitySum, ref depth, ref uptime, ..} = assetQualityEntry;
        let algxAvg = (algxBalanceSum.val() as f64) / (getSecondsInEpoch() as f64);
        let uptimeStr = format!("{}", uptime.val());
        let uptimef64 = uptimeStr.parse::<f64>().unwrap();
        let qualityFinal = Quality::from(
          match mainnet_period {
            MainnetPeriod::Version1 =>
              qualitySum.val().powf(0.5) * uptimef64.powi(5) * depth.val().powf(0.3),
            MainnetPeriod::Version2 =>
              qualitySum.val().powf(0.5) * uptimef64.powi(5) * depth.val().powf(0.3) * algxAvg.powf(0.2)
          }
        );
        let owner_rewards_key = OwnerRewardsKey{
          wallet: ownerWallet.clone(), assetId: *assetId
        };
        let earned_algx_entry = EarnedAlgxEntry {
          quality: qualityFinal, earned_algx: EarnedAlgx::from(0)
        };

        ownerRewardsResToFinalRewardsEntry.insert(owner_rewards_key, earned_algx_entry);
        return total_quality + qualityFinal.val();
      });
    return total_quality + quality;
  });

  stateMachine.ownerWalletAssetToRewards.keys().for_each(|ownerWallet| {
    let ownerAssetEntries = stateMachine.ownerWalletAssetToRewards.get(ownerWallet).unwrap();
    ownerAssetEntries.keys()
      .for_each(|assetId| {
        let assetQualityEntry = ownerAssetEntries.get(assetId).unwrap();
        let final_rewards_entry = ownerRewardsResToFinalRewardsEntry.get_mut(&OwnerRewardsKey{
          wallet: ownerWallet.clone(), assetId: *assetId
        }).unwrap();

        // FIXME - 18k depends on epoch
        final_rewards_entry.earned_algx =
          EarnedAlgx::from((18000000.0 * final_rewards_entry.quality.val() / total_quality).round() as u64);
      });
    });
  // rewardsFinal.sort_by(|a, b| a.qualityFinal.val().partial_cmp(&b.qualityFinal.val()).unwrap());

  println!("saving rewards in DB!");
  save_rewards(epoch, &stateMachine.ownerWalletAssetToRewards, &ownerRewardsResToFinalRewardsEntry).await;

  // dbg!(rewardsFinal);
  Ok(())
}

fn getTimeFromRound (blockToUnixTime: &HashMap<u32, u32>, round: &u32) -> u32 {
  return *blockToUnixTime.get(round).unwrap();
}
fn updateBalances (changedEscrows: &Vec<String>, changeTime: &u32, escrowToBalance: &mut HashMap<String, u64>,
  escrowTimeToBalance: &HashMap<EscrowTimeKey, u64>) {
    changedEscrows.iter().for_each(|escrow| {
      let key = EscrowTimeKey{escrow: String::from(escrow), unix_time: *changeTime};
      let balance = escrowTimeToBalance.get(&key);
      escrowToBalance.insert(String::from(escrow), *balance.unwrap());
    });
  }
// const updateBalances = ({changedEscrows, changeTime, escrowToBalance,
//   escrowTimeToBalance}) => {
//   changedEscrows.forEach(escrow => {
//     const balance = escrowTimeToBalance[`${escrow}:${changeTime}`];
//     escrowToBalance[escrow] = balance;
//   });
// };

#[derive(Debug)]
pub struct StateMachine<'a> {
    escrowToBalance: HashMap<String, u64>,
    spreads: HashMap<u32, Spread>,
    ownerWalletAssetToRewards: HashMap<String,HashMap<u32,OwnerRewardsResult>>,
    ownerWalletToALGXBalance: HashMap<&'a String,u64>,
    algoPrice: f64,
    timestep: u32
}

fn getInitialBalances(unixTime: u32, escrows: &Vec<EscrowValue>) -> HashMap<String, u64> {
    return escrows.iter().fold(HashMap::new(), |mut escrowToBalance, escrow| {
        let addr = &escrow.id;
        let history = &escrow.data.history;
        let mut balance = 0; //FIXME?
        for historyItem in history {
            if (historyItem.time <= unixTime) {
                balance = match escrow.data.escrow_info.is_algo_buy_escrow {
                    true => historyItem.algo_amount.clone().unwrap(),
                    false => historyItem.asa_amount.clone().unwrap()
                }
            } else {
                break;
            }
        }
        escrowToBalance.insert(String::from(addr), balance);
        escrowToBalance
    });
}

#[derive(Debug)]
pub struct InitialState {
    algxBalanceData: Vec<CouchDBGroupedResult<AlgxBalanceValue>>,
    allAssets: Vec<u32>,
    allAssetsSet: HashSet<u32>,
    assetIdToEscrows: HashMap<u32, Vec<String>>,
    blockToUnixTime: HashMap<u32, u32>,
    epoch: u16,
    epochStart: u32,
    epochEnd: u32,
    epochLaunchTime: u32,
    escrowTimeToBalance: HashMap<EscrowTimeKey, u64>,
    tinymanPrices: Vec<PriceData>,
    unixTimeToChangedEscrows: HashMap<u32, Vec<String>>,
    changedEscrowSeq: Vec<u32>,
    formattedEscrowData:Vec<CouchDBResult<EscrowValue>>,
    escrowAddrs: Vec<String>,
    accountData: Vec<CouchDBResult<String>>,
    escrows: Vec<EscrowValue>,
    escrowAddrToData: HashMap<String, EscrowValue>
}



fn getSecondsInEpoch() -> u32 {
    return 604800;
}

fn getEpochStart(epoch: u16, epochLaunchTime: u32) -> u32 {
    let start = epochLaunchTime;
    let secondsInEpoch = getSecondsInEpoch();
    return start + (secondsInEpoch * ((epoch as u32) - 1));
}

fn getEpochEnd(epoch: u16, epochLaunchTime: u32,) -> u32 {
    getEpochStart(epoch, epochLaunchTime) + getSecondsInEpoch()
}

// const getEpochEnd = epoch => {
//     return getEpochStart(epoch) + getSecondsInEpoch();
//   };

  

fn getEscrowAndTimeToBalance(escrows: &Vec<EscrowValue>) -> HashMap<EscrowTimeKey,u64> {
    let escrowTimeMap: HashMap<EscrowTimeKey,u64> = escrows.iter().fold(HashMap::new(), |mut escrowTimeMap, escrow| {
        escrow.data.history.iter().for_each(|historyItem| {
            let time = historyItem.time;
            let balance = match escrow.data.escrow_info.is_algo_buy_escrow {
                true => historyItem.algo_amount,
                false => historyItem.asa_amount
            };
            let key = EscrowTimeKey{escrow: escrow.id.clone(), unix_time: time};
            escrowTimeMap.insert(key, balance.unwrap());
        });
        escrowTimeMap
    });

    escrowTimeMap
}
fn getSequenceInfo(escrows: &Vec<EscrowValue>) -> (HashMap<u32, Vec<String>>,Vec<u32>) {
    let unixTimeToChangedEscrows: HashMap<u32, Vec<String>> =
        escrows.iter().fold(HashMap::new(), |mut timeline, escrow| {
            let times: Vec<u32> = escrow.data.history.iter().map(|historyItem| historyItem.time).collect();
            times.iter().for_each(|time| {
                if (!timeline.contains_key(time)) {
                    timeline.insert(time.clone(), Vec::new());
                }
                let mut addrArr = timeline.get_mut(time).unwrap();
                addrArr.push(escrow.id.clone());
            });
            timeline
        });

    let unixTimes = unixTimeToChangedEscrows.keys().cloned().collect();

    return (unixTimeToChangedEscrows, unixTimes);
}
