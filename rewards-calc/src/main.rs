use dotenv;
use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::{fmt, time};
mod structs;
use structs::{EscrowValue, EscrowTimeKey};
use crate::structs::History;
use crate::structs::CouchDBOuterResp;
mod query_couch;
mod get_spreads;
mod update_spreads;
mod update_rewards;
use update_spreads::updateSpreads;
use update_rewards::updateRewards;
use get_spreads::getSpreads;
use rand::Rng;
use crate::update_rewards::OwnerRewardsResult;
use crate::structs::CouchDBResult;
use crate::update_rewards::{QualityType, OwnerFinalRewardsResult, ProtectedQualityType};
use query_couch::query_couch_db;
use crate::get_spreads::Spread;
//aaa {"results":[
//{"total_rows":305541,"offset":71,"rows":[
//    {"id":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","key":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","value":{
use QualityType::{Quality, Uptime, Depth, Price, AlgxBalance};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
  dotenv::from_filename(".env").expect(".env file can't be found!");
  let env = dotenv::vars().fold(HashMap::new(), |mut map, val| {
      map.insert(val.0, val.1);
      map
  });
  // println!("{:?}", result.get("ALGORAND_NETWORK").take());

  let couch_dburl = env.get("COUCHDB_BASE_URL").expect("Missing COUCHDB_BASE_URL");
  let keys = [String::from("2")].to_vec();
  let accountEpochDataQueryRes = query_couch_db::<String>(&couch_dburl,
      &"formatted_escrow".to_string(),
      &"formatted_escrow".to_string(),
      &"epochs".to_string(), &keys).await;
  let accountData = accountEpochDataQueryRes.unwrap().results.remove(0).rows;
  let escrowAddrs:Vec<String> = accountData.iter().map(|row| String::clone(&row.value)).collect();
  //println!("{:?}", escrowAddrs);
  
  let formattedEscrowDataQueryRes = query_couch_db::<EscrowValue>(&couch_dburl,
      &"formatted_escrow".to_string(),
      &"formatted_escrow".to_string(),
      &"orderLookup".to_string(), &escrowAddrs).await;

  let formattedEscrowData = formattedEscrowDataQueryRes.unwrap().results.remove(0).rows;

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

  let ownerWallets = escrows.iter().map(|escrow| &escrow.data.escrow_info.owner_addr);


  // let formatted_escrow_data = query_couch_db::<EscrowValue>(&couch_dburl,
  //     &"formatted_escrow".to_string(),
  //     &"formatted_escrow".to_string(),
  //     &"orderLookup".to_string(), &escrowAddrs).await;

  let (unixTimeToChangedEscrows, changedEscrowSeq) = getSequenceInfo(&escrows);

  let escrowTimeToBalance = getEscrowAndTimeToBalance(&escrows);

    //FIXME - change to read args for epoch
  let epochLaunchTime = env.get("EPOCH_LAUNCH_UNIX_TIME").unwrap().parse::<u32>().unwrap();
  let epochStart = getEpochStart(2, epochLaunchTime);

  let epochEnd = getEpochEnd(2, epochLaunchTime);

  let allAssetsSet: HashSet<u32> = escrowAddrToData.keys().fold(HashSet::new(), |mut set, escrow| {
      let asset = escrowAddrToData.get(escrow).unwrap().data.escrow_info.asset_id;
      set.insert(asset.clone());
      set
  });
  let allAssets: Vec<u32> = allAssetsSet.clone().into_iter().collect();

  // dbg!(allAssetsSet);

  let initialState = InitialState {
      allAssets,
      allAssetsSet,
      assetIdToEscrows,
      changedEscrowSeq,
      epochStart,
      epochEnd,
      epochLaunchTime,
      escrowTimeToBalance,
      unixTimeToChangedEscrows,
      formattedEscrowData,
      escrowAddrs,
      accountData,
      escrows,
      escrowAddrToData,
  };

  //dbg!(initialState);

  let mut timestep = epochStart;
  let mut escrowstep = 0;
  let mut ownerstep = 0;

  println!("{} {}", epochStart, epochEnd);

  //state machine data

  let escrowToBalance = getInitialBalances(timestep, &initialState.escrows);
  let spreads = getSpreads(&escrowToBalance, &initialState.escrowAddrToData);

  let ownerWalletAssetToRewards: HashMap<String,HashMap<u32,OwnerRewardsResult>> = HashMap::new();

  let mut stateMachine = StateMachine {
      escrowToBalance,
      //ownerWalletToALGXBalance,
      ownerWalletAssetToRewards,
      spreads,
    };

  //dbg!(spreads);

  let mut rng = rand::thread_rng();

  loop {
    let curMinute = timestep / 60;
    timestep = ((curMinute + 1) * 60) + rng.gen_range(0..60);
    let mut escrowDidChange = false;
    let ownerWalletsBalanceChangeSet:HashSet<String> = HashSet::new();


    while (escrowstep < initialState.changedEscrowSeq.len() &&
      initialState.changedEscrowSeq[escrowstep] <= timestep) {
        let changeTime = &initialState.changedEscrowSeq[escrowstep];
        let changedEscrows = initialState.unixTimeToChangedEscrows.get(changeTime).unwrap();
        escrowDidChange = true;
        updateBalances(&changedEscrows, &changeTime,
          &mut stateMachine.escrowToBalance, &initialState.escrowTimeToBalance);
        escrowstep += 1;
        //updateBalances
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
    println!("{}", (timestep as f64 - epochStart as f64) / (epochEnd as f64 - epochStart as f64) * 100.0);

    if (timestep >= epochEnd) {
      break;
    }
  }

  let mut rewardsFinal: Vec<OwnerFinalRewardsResult> = Vec::new();
  
  stateMachine.ownerWalletAssetToRewards.keys().for_each(|ownerWallet| {
    let mut finalEntry = stateMachine.ownerWalletAssetToRewards.get(ownerWallet).unwrap().values()
      .fold(OwnerFinalRewardsResult::default(), |mut qualityEntry, assetQualityEntry| {
        let OwnerRewardsResult {ref algxBalanceSum, ref qualitySum, ref depth, ref uptime, ..} = assetQualityEntry;
        let algxAvg = algxBalanceSum.getAlgx() / getSecondsInEpoch() as u64;
        let uptimeStr = format!("{}", uptime.getUptime());
        let uptimef64 = uptimeStr.parse::<f64>().unwrap();
        let qualityFinal = ProtectedQualityType::from(Quality(
          qualitySum.getQuality().powf(0.5) * uptimef64.powi(5) * depth.getDepth().powf(0.3)
        ));

        qualityEntry.uptime += *uptime;
        qualityEntry.qualitySum += *qualitySum;
        qualityEntry.depthSum += *depth;
        qualityEntry.qualityFinal += qualityFinal;
        qualityEntry

      });
    finalEntry.ownerWallet = ownerWallet.clone();
    rewardsFinal.push(finalEntry);
  });
  rewardsFinal.sort_by(|a, b| a.qualityFinal.getQuality().partial_cmp(&b.qualityFinal.getQuality()).unwrap());
  dbg!(rewardsFinal);

  Ok(())
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
pub struct StateMachine {
    escrowToBalance: HashMap<String, u64>,
    spreads: HashMap<u32, Spread>,
    ownerWalletAssetToRewards: HashMap<String,HashMap<u32,OwnerRewardsResult>>
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
    allAssets: Vec<u32>,
    allAssetsSet: HashSet<u32>,
    assetIdToEscrows: HashMap<u32, Vec<String>>,
    epochStart: u32,
    epochEnd: u32,
    epochLaunchTime: u32,
    escrowTimeToBalance: HashMap<EscrowTimeKey, u64>,
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

fn getEpochStart(epoch: u8, epochLaunchTime: u32) -> u32 {
    let start = epochLaunchTime;
    let secondsInEpoch = getSecondsInEpoch();
    return start + (secondsInEpoch * ((epoch as u32) - 1));
}

fn getEpochEnd(epoch: u8, epochLaunchTime: u32,) -> u32 {
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
