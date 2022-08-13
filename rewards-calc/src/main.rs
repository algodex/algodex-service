use dotenv;
use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::fmt;
mod structs;
use structs::{EscrowValue, EscrowTimeKey};
use crate::structs::History;
use crate::structs::CouchDBOuterResp;
mod query_couch;
mod get_spreads;
use get_spreads::getSpreads;

use crate::structs::CouchDBResult;

use query_couch::query_couch_db;

//aaa {"results":[
//{"total_rows":305541,"offset":71,"rows":[
//    {"id":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","key":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","value":{

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
    //println!("{:?}", escrowAddrToData);

    let ownerWallets = escrows.iter().map(|escrow| &escrow.data.escrow_info.owner_addr);


    // let formatted_escrow_data = query_couch_db::<EscrowValue>(&couch_dburl,
    //     &"formatted_escrow".to_string(),
    //     &"formatted_escrow".to_string(),
    //     &"orderLookup".to_string(), &escrowAddrs).await;

    let (unixTimeToChangedEscrows, unixTimes) = getSequenceInfo(&escrows);

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
        epochStart,
        epochEnd,
        epochLaunchTime,
        escrowTimeToBalance,
        unixTimeToChangedEscrows,
        unixTimes,
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
    dbg!(spreads);
    Ok(())
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
struct InitialState {
    allAssets: Vec<u32>,
    allAssetsSet: HashSet<u32>,
    epochStart: u32,
    epochEnd: u32,
    epochLaunchTime: u32,
    escrowTimeToBalance: HashMap<EscrowTimeKey, u64>,
    unixTimeToChangedEscrows: HashMap<u32, Vec<String>>,
    unixTimes: Vec<u32>,
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
