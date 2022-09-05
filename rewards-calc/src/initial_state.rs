use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json_any_key::*;

use std::collections::HashSet;
use std::error::Error;
use std::fs::{self, File};
use std::io::Write;

use crate::epoch::{get_epoch_end, get_epoch_start};
use crate::{structs, Cli};

use crate::query_couch::{query_couch_db, query_couch_db_with_full_str};

use crate::structs::{AlgxBalanceValue, CouchDBResult, EscrowTimeKey, EscrowValue, TinymanTrade};

use crate::structs::CouchDBResp;

use urlencoding::encode;

use clap::Parser;

#[derive(Debug, Serialize, Deserialize)]
pub struct InitialState {
    pub algx_balance_data: Vec<CouchDBResult<AlgxBalanceValue>>,
    pub all_assets: Vec<u32>,
    pub all_assets_set: HashSet<u32>,
    #[serde(with = "any_key_map")]
    pub asset_id_to_escrows: HashMap<u32, Vec<String>>,
    #[serde(with = "any_key_map")]
    pub block_to_unix_time: HashMap<u32, u32>,
    pub env: HashMap<String, String>,
    pub epoch: u16,
    pub epoch_start: u32,
    pub epoch_end: u32,
    pub epoch_launch_time: u32,
    #[serde(with = "any_key_map")]
    pub escrow_time_to_balance: HashMap<EscrowTimeKey, u64>,
    pub tinyman_prices: Vec<PriceData>,
    #[serde(with = "any_key_map")]
    pub unix_time_to_changed_escrows: HashMap<u32, Vec<String>>,
    pub changed_escrow_seq: Vec<u32>,
    pub formatted_escrow_data: Vec<CouchDBResult<EscrowValue>>,
    pub escrow_addrs: Vec<String>,
    pub account_data: Vec<CouchDBResult<String>>,
    pub escrows: Vec<EscrowValue>,
    pub escrow_addr_to_data: HashMap<String, EscrowValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceData {
    pub unix_time: u32,
    pub price: f64,
}

fn get_escrow_and_time_to_balance(escrows: &[EscrowValue]) -> HashMap<EscrowTimeKey, u64> {
    let escrow_time_map: HashMap<EscrowTimeKey, u64> =
        escrows.iter().fold(HashMap::new(), |mut escrow_time_map, escrow| {
            escrow.data.history.iter().for_each(|history_item| {
                let time = history_item.time;
                let balance = match escrow.data.escrow_info.is_algo_buy_escrow {
                    true => history_item.algo_amount,
                    false => history_item.asa_amount,
                };
                let key = EscrowTimeKey { escrow: escrow.id.clone(), unix_time: time };
                escrow_time_map.insert(key, balance.unwrap());
            });
            escrow_time_map
        });

    escrow_time_map
}
fn get_sequence_info(escrows: &[EscrowValue]) -> (HashMap<u32, Vec<String>>, Vec<u32>) {
    let unix_time_to_changed_escrows: HashMap<u32, Vec<String>> =
        escrows.iter().fold(HashMap::new(), |mut timeline, escrow| {
            let times: Vec<u32> =
                escrow.data.history.iter().map(|history_item| history_item.time).collect();
            times.iter().for_each(|time| {
                if !timeline.contains_key(time) {
                    timeline.insert(*time, Vec::new());
                }
                let addr_arr = timeline.get_mut(time).unwrap();
                addr_arr.push(escrow.id.clone());
            });
            timeline
        });

    let mut unix_times: Vec<u32> = unix_time_to_changed_escrows.keys().cloned().collect();
    unix_times.sort();
    (unix_time_to_changed_escrows, unix_times)
}

pub fn get_time_from_round(block_to_unix_time: &HashMap<u32, u32>, round: &u32) -> u32 {
    return *block_to_unix_time.get(round).unwrap();
}

pub fn get_initial_balances(unix_time: u32, escrows: &[EscrowValue]) -> HashMap<String, u64> {
    return escrows.iter().fold(HashMap::new(), |mut escrow_to_balance, escrow| {
        let addr = &escrow.id;
        let history = &escrow.data.history;
        let mut balance = 0; //FIXME?
        for history_item in history {
            if history_item.time <= unix_time {
                balance = match escrow.data.escrow_info.is_algo_buy_escrow {
                    true => history_item.algo_amount.unwrap(),
                    false => history_item.asa_amount.unwrap(),
                }
            } else {
                break;
            }
        }
        escrow_to_balance.insert(String::from(addr), balance);
        escrow_to_balance
    });
}

fn get_tinyman_prices_from_data(tinyman_trades_data: CouchDBResp<TinymanTrade>) -> Vec<PriceData> {
    let mut prices: Vec<PriceData> = tinyman_trades_data
        .rows
        .iter()
        .map(|trade_item| &trade_item.value)
        .map(|trade_item| {
            let time = trade_item.unix_time;
            let assets = (trade_item.pool_xfer_asset_id, trade_item.user_xfer_asset_id);
            let algo_amount = match assets {
                (1, _) => trade_item.pool_xfer_amount,
                (_, 1) => trade_item.user_xfer_amount,
                (_, _) => panic!("Unexpected asset!"),
            };
            let usdc_amount = match assets {
                (31566704, _) => trade_item.pool_xfer_amount,
                (_, 31566704) => trade_item.user_xfer_amount,
                (_, _) => panic!("Unexpected asset!"),
            };

            let price = usdc_amount as f64 / algo_amount as f64;
            PriceData { unix_time: time, price }
        })
        .collect();

    prices.sort_by(|a, b| a.unix_time.cmp(&b.unix_time));
    prices
}

pub async fn get_initial_state() -> Result<InitialState, Box<dyn Error>> {
    let cli = Cli::parse();

    let epoch = cli.epoch;
    println!("Epoch is {epoch}");
    if epoch < 1 {
        panic!("Epoch cannot be less than 1!");
    }

    dotenv::from_filename(".env").expect(".env file can't be found!");
    let env = dotenv::vars().fold(HashMap::new(), |mut map, val| {
        map.insert(val.0, val.1);
        map
    });

    let couch_dburl = env.get("COUCHDB_BASE_URL_RUST").expect("Missing COUCHDB_BASE_URL_RUST");
    let api_url = env.get("API_PROXY_URL").expect("Missing API_PROXY_URL");
    let keys = [epoch.to_string()].to_vec();
    let account_epoch_data_query_res = query_couch_db::<String>(
        api_url,
        &"formatted_escrow".to_string(),
        &"formatted_escrow".to_string(),
        &"epochs".to_string(),
        &keys,
        false,
    )
    .await;
    let account_data = account_epoch_data_query_res.unwrap().rows;
    let escrow_addrs: Vec<String> =
        account_data.iter().map(|row| String::clone(&row.value)).collect();

    let formatted_escrow_data_query_res = query_couch_db::<EscrowValue>(
        api_url,
        &"formatted_escrow".to_string(),
        &"formatted_escrow".to_string(),
        &"orderLookup".to_string(),
        &escrow_addrs,
        false,
    )
    .await;

    let formatted_escrow_data = formatted_escrow_data_query_res?.rows;

    let escrows: Vec<EscrowValue> =
        formatted_escrow_data.iter().map(|row| row.value.clone()).collect();
    let escrow_addr_to_data: HashMap<String, EscrowValue> =
        formatted_escrow_data.iter().fold(HashMap::new(), |mut map, row| {
            map.insert(row.id.clone(), row.value.clone());
            map
        });

    let asset_id_to_escrows: HashMap<u32, Vec<String>> =
        escrow_addr_to_data.keys().fold(HashMap::new(), |mut map, escrow| {
            let asset_id = &escrow_addr_to_data.get(escrow).unwrap().data.escrow_info.asset_id;
            if !map.contains_key(asset_id) {
                map.insert(*asset_id, Vec::new());
            }
            let vec = map.get_mut(asset_id).unwrap();
            vec.push(escrow.clone());
            map
        });

    let owner_wallets: Vec<String> =
        escrows.iter().map(|escrow| &escrow.data.escrow_info.owner_addr).cloned().collect();

    let algx_balance_data_query_res = query_couch_db::<AlgxBalanceValue>(
        api_url,
        &"algx_balance".to_string(),
        &"algx_balance".to_string(),
        &"algx_balance2".to_string(),
        &owner_wallets,
        false,
    )
    .await;
    let mut algx_balance_data = algx_balance_data_query_res.unwrap().rows;

    algx_balance_data.sort_by(|a, b| a.value.round.partial_cmp(&b.value.round).unwrap());

    let algx_change_rounds_set: HashSet<u32> = algx_balance_data
        .iter()
        .map(|row| row.value.round)
        .fold(HashSet::new(), |mut set, item| {
            set.insert(item);
            set
        });
    let blocks_vec: Vec<String> =
        algx_change_rounds_set.iter().map(|round| round.to_string()).collect();

    let block_times_data_query_res = query_couch_db::<u32>(
        api_url,
        &"blocks".to_string(),
        &"blocks".to_string(),
        &"blockToTime".to_string(),
        &blocks_vec,
        false,
    )
    .await;
    let block_times_data = block_times_data_query_res?.rows;
    let block_to_unix_time: HashMap<u32, u32> =
        block_times_data.iter().fold(HashMap::new(), |mut map, block| {
            let key = match &block.key {
                structs::CouchDBKey::StringVal(str) => str,
                _ => panic!("Invalid key!"),
            }
            .parse::<u32>()
            .unwrap();
            map.insert(key, block.value);
            map
        });
    // println!("{:?}", blockTimesData);

    let epoch_launch_time = env.get("EPOCH_LAUNCH_UNIX_TIME").unwrap().parse::<u32>().unwrap();
    let epoch_start = get_epoch_start(epoch, epoch_launch_time);
    let epoch_end = get_epoch_end(epoch, epoch_launch_time);

    let encode_price_query = |time| -> String {
        let vec = vec![1, 31566704, time];
        let json = serde_json::to_string(&vec).unwrap();
        let encoded = encode(&json).into_owned();
        encoded
    };

    let epoch_start_str = encode_price_query(epoch_start);
    let epoch_end_str = encode_price_query(epoch_end);

    let tinyman_str = format!(
        "inclusive_end=true&start_key={}&end_key={}&reduce=false",
        epoch_start_str, epoch_end_str
    );

    let tinyman_trades = query_couch_db_with_full_str::<TinymanTrade>(
        couch_dburl,
        &"blocks".to_string(),
        &"blocks".to_string(),
        &"tinymanTrades".to_string(),
        &tinyman_str.to_string(),
    )
    .await;
    // dbg!(tinymanTrades.as_ref());

    let tinyman_trades_data = tinyman_trades.unwrap();
    let tinyman_prices = get_tinyman_prices_from_data(tinyman_trades_data);

    // dbg!(tinymanPrices);
    // let formatted_escrow_data = query_couch_db::<EscrowValue>(&couch_dburl,
    //     &"formatted_escrow".to_string(),
    //     &"formatted_escrow".to_string(),
    //     &"orderLookup".to_string(), &escrowAddrs).await;

    let (unix_time_to_changed_escrows, changed_escrow_seq) = get_sequence_info(&escrows);

    let escrow_time_to_balance = get_escrow_and_time_to_balance(&escrows);

    //FIXME - change to read args for epoch
    let all_assets_set: HashSet<u32> =
        escrow_addr_to_data.keys().fold(HashSet::new(), |mut set, escrow| {
            let asset = escrow_addr_to_data.get(escrow).unwrap().data.escrow_info.asset_id;
            set.insert(asset);
            set
        });
    let all_assets: Vec<u32> = all_assets_set.clone().into_iter().collect();

    // dbg!(allAssetsSet);
    // let cloned: Vec<CouchDBResult<EscrowValue>> = formattedEscrowDataQueryRes.unwrap().results[0].rows.clone();

    let initial_state = InitialState {
        algx_balance_data,
        all_assets,
        all_assets_set,
        asset_id_to_escrows,
        block_to_unix_time,
        changed_escrow_seq,
        env,
        epoch,
        epoch_start,
        epoch_end,
        epoch_launch_time,
        escrow_time_to_balance,
        tinyman_prices,
        unix_time_to_changed_escrows,
        formatted_escrow_data,
        escrow_addrs,
        account_data,
        escrows,
        escrow_addr_to_data,
    };

    Ok(initial_state)
}

pub fn save_initial_state(state: &InitialState) {
    println!("Saving initial state...");
    let filename = format!("integration_test/test_data/initial_state_epoch_{}.json", state.epoch);
    println!("filename is: {}", filename);

    // create directory if not exists
    fs::create_dir_all("integration_test/test_data").unwrap();
    let mut file = File::create(filename).expect("Unable to create file");
    let json = serde_json::to_string(&state).unwrap();
    file.write_all(json.as_bytes()).expect("Unable to write to file");
    println!("Initial state saved.");
}
