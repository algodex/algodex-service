// Calculate Algodex Rewards
// Example:
//   cargo run --release -- --epoch=2

#[macro_use]
extern crate approx;
#[macro_use]
extern crate lazy_static;

use serde::{Deserialize, Serialize};
use serde_json_any_key::*;
use std::collections::hash_map::DefaultHasher;
use std::collections::{HashMap, HashSet};
use std::error::Error;
use std::fs::{self, File};
use std::hash::{Hash, Hasher};
use std::io::Write;

mod structs;
use crate::quality_type::EarnedAlgx;
use crate::update_owner_liquidity_quality::OwnerRewardsKey;
use crate::update_owner_liquidity_quality::{check_mainnet_period, MainnetPeriod};
use structs::{AlgxBalanceValue, EscrowTimeKey, EscrowValue, TinymanTrade};
mod get_spreads;
mod quality_type;
mod query_couch;
mod update_owner_liquidity_quality;
mod update_spreads;
use get_spreads::get_spreads;
use rand::Rng;
use update_owner_liquidity_quality::{update_owner_wallet_quality_per_asset, EarnedAlgxEntry};
use update_spreads::update_spreads;
mod save_rewards;
use crate::save_rewards::save_rewards;
use crate::structs::CouchDBResult;
use crate::update_owner_liquidity_quality::OwnerWalletAssetQualityResult;
use query_couch::{query_couch_db, query_couch_db_with_full_str};
// use query_couch::query_couch_db2;
use crate::get_spreads::Spread;
use crate::quality_type::Quality;
use crate::structs::CouchDBResp;
use rand::SeedableRng;
use rand_pcg::Pcg32;
use urlencoding::encode;

use clap::Parser;

#[derive(Parser)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    #[clap(short, long)]
    epoch: u16,
    #[clap(short, long)]
    debug: u8,
}

//aaa {"results":[
//{"total_rows":305541,"offset":71,"rows":[
//    {"id":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","key":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","value":{

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceData {
    pub unix_time: u32,
    pub price: f64,
}

lazy_static! {
    static ref DEBUG: bool = Cli::parse().debug == 1;
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

fn calculate_hash<T: Hash>(t: &T) -> u64 {
    let mut s = DefaultHasher::new();
    t.hash(&mut s);
    s.finish()
}

async fn get_initial_state() -> Result<InitialState, Box<dyn Error>> {
    let cli = Cli::parse();

    // You can check the value provided by positional arguments, or option arguments
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
    // println!("{:?}", result.get("ALGORAND_NETWORK").take());

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
    // println!("{:?}", escrowAddrs);

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

    //println!("{:?}", escrowAddrToData);

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

fn save_initial_state(state: &InitialState) {
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

fn save_state_machine(state: &StateMachine) {
    //println!("Saving state machine...");
    let filename = format!("integration_test/test_data/state_machine_{}.json", state.timestep);
    //println!("filename is: {}", filename);
    let mut file = File::create(filename).expect("Unable to create file");
    let json = serde_json::to_string(&state).unwrap();
    file.write_all(json.as_bytes()).expect("Unable to write to file");
    //println!("State machine saved.");
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let initial_state = get_initial_state().await.unwrap();

    if *DEBUG {
        save_initial_state(&initial_state);
    }
    // IF SAVE DEBUG

    let epoch_start = initial_state.epoch_start;
    let epoch_end = initial_state.epoch_end;
    let epoch = initial_state.epoch;

    //dbg!(initialState);

    let timestep = epoch_start;

    let mut escrowstep = 0;

    // println!("{} {}", epochStart, epochEnd);

    //state machine data

    let escrow_to_balance = get_initial_balances(timestep, &initial_state.escrows);
    let spreads = get_spreads(&escrow_to_balance, &initial_state.escrow_addr_to_data);

    let owner_wallet_asset_to_quality_result: HashMap<
        String,
        HashMap<u32, OwnerWalletAssetQualityResult>,
    > = HashMap::new();
    let owner_wallet_to_algx_balance: HashMap<&String, u64> = HashMap::new();

    let mut state_machine = StateMachine {
        escrow_to_balance,
        owner_wallet_to_algx_balance,
        owner_wallet_asset_to_quality_result,
        spreads,
        algo_price: 0.0,
        timestep,
    };

    // Use the couchdb url to seed the random number generator, since it contains a password
    let seed = calculate_hash(initial_state.env.get("REWARDS_RANDOM_SEED").unwrap());
    let mut rng = Pcg32::seed_from_u64(seed);

    let mut owner_wallet_step = 0;
    let mut algo_price_step = 0;

    loop {
        let cur_minute = state_machine.timestep / 60;
        state_machine.timestep = ((cur_minute + 1) * 60) + rng.gen_range(0..60);
        let mut escrow_did_change = false;
        // let ownerWalletsBalanceChangeSet:HashSet<String> = HashSet::new();
        while owner_wallet_step < initial_state.algx_balance_data.len() {
            let owner_balance_entry = &initial_state.algx_balance_data[owner_wallet_step];
            let owner_wallet_time = get_time_from_round(
                &initial_state.block_to_unix_time,
                &owner_balance_entry.value.round,
            );
            if owner_wallet_time > state_machine.timestep {
                break;
            }
            let wallet: &String = owner_balance_entry.key.strval();
            state_machine
                .owner_wallet_to_algx_balance
                .insert(wallet, owner_balance_entry.value.balance);
            owner_wallet_step += 1;
        }

        // Price steps
        while algo_price_step < initial_state.tinyman_prices.len() {
            let price_entry = &initial_state.tinyman_prices[algo_price_step];
            if price_entry.unix_time > state_machine.timestep {
                break;
            }
            state_machine.algo_price = price_entry.price;
            algo_price_step += 1;
        }

        while escrowstep < initial_state.changed_escrow_seq.len()
            && initial_state.changed_escrow_seq[escrowstep] <= state_machine.timestep
        {
            let change_time = &initial_state.changed_escrow_seq[escrowstep];
            let changed_escrows =
                initial_state.unix_time_to_changed_escrows.get(change_time).unwrap();
            escrow_did_change = true;
            update_balances(
                changed_escrows,
                change_time,
                &mut state_machine.escrow_to_balance,
                &initial_state.escrow_time_to_balance,
            );
            escrowstep += 1;
        }

        if escrow_did_change {
            update_spreads(&initial_state, &mut state_machine);
        }

        let assets_with_balances: HashSet<&u32> =
            state_machine.escrow_to_balance.keys().fold(HashSet::new(), |mut set, escrow| {
                let asset_id = &initial_state
                    .escrow_addr_to_data
                    .get(escrow)
                    .unwrap()
                    .data
                    .escrow_info
                    .asset_id;
                set.insert(asset_id);
                set
            });

        assets_with_balances.into_iter().for_each(|asset_id| {
            update_owner_wallet_quality_per_asset(asset_id, &mut state_machine, &initial_state);
        });
        println!(
            "{}",
            (state_machine.timestep as f64 - epoch_start as f64)
                / (epoch_end as f64 - epoch_start as f64)
                * 100.0
        );

        if state_machine.timestep >= epoch_end {
            break;
        }

        if *DEBUG && epoch == 2 {
            println!("saving state at: {}", state_machine.timestep);
            save_state_machine(&state_machine);
        }
    }

    // Need to give rewards per asset

    let mainnet_period = check_mainnet_period(&epoch_end);

    let mut owner_rewards_res_to_final_rewards_entry: HashMap<OwnerRewardsKey, EarnedAlgxEntry> =
        HashMap::new();
    let total_quality: f64 = state_machine.owner_wallet_asset_to_quality_result.keys().fold(
        0f64,
        |total_quality, owner_wallet| {
            let owner_asset_entries =
                state_machine.owner_wallet_asset_to_quality_result.get(owner_wallet).unwrap();
            let quality = owner_asset_entries.keys().fold(0f64, |total_quality, asset_id| {
                let asset_quality_entry = owner_asset_entries.get(asset_id).unwrap();
                let OwnerWalletAssetQualityResult {
                    ref algx_balance_sum,
                    ref quality_sum,
                    ref depth,
                    ref uptime,
                    ..
                } = asset_quality_entry;
                let algx_avg = (algx_balance_sum.val() as f64) / (get_seconds_in_epoch() as f64);
                let uptime_str = format!("{}", uptime.val());
                let uptimef64 = uptime_str.parse::<f64>().unwrap();
                let quality_final = Quality::from(match mainnet_period {
                    MainnetPeriod::Version1 => {
                        quality_sum.val().powf(0.5) * uptimef64.powi(5) * depth.val().powf(0.3)
                    }
                    MainnetPeriod::Version2 => {
                        quality_sum.val().powf(0.5)
                            * uptimef64.powi(5)
                            * depth.val().powf(0.3)
                            * algx_avg.powf(0.2)
                    }
                });
                let owner_rewards_key =
                    OwnerRewardsKey { wallet: owner_wallet.clone(), asset_id: *asset_id };
                let earned_algx_entry =
                    EarnedAlgxEntry { quality: quality_final, earned_algx: EarnedAlgx::from(0) };

                owner_rewards_res_to_final_rewards_entry
                    .insert(owner_rewards_key, earned_algx_entry);
                total_quality + quality_final.val()
            });
            total_quality + quality
        },
    );

    state_machine.owner_wallet_asset_to_quality_result.keys().for_each(|owner_wallet| {
        let owner_asset_entries =
            state_machine.owner_wallet_asset_to_quality_result.get(owner_wallet).unwrap();
        owner_asset_entries.keys().for_each(|asset_id| {
            let _asset_quality_entry = owner_asset_entries.get(asset_id).unwrap();
            let final_rewards_entry = owner_rewards_res_to_final_rewards_entry
                .get_mut(&OwnerRewardsKey { wallet: owner_wallet.clone(), asset_id: *asset_id })
                .unwrap();

            // FIXME - 18k depends on epoch
            final_rewards_entry.earned_algx = EarnedAlgx::from(
                (18000000.0 * final_rewards_entry.quality.val() / total_quality).round() as u64,
            );
        });
    });
    // rewardsFinal.sort_by(|a, b| a.qualityFinal.val().partial_cmp(&b.qualityFinal.val()).unwrap());

    println!("saving rewards in DB!");
    save_rewards(
        epoch,
        &state_machine.owner_wallet_asset_to_quality_result,
        &owner_rewards_res_to_final_rewards_entry,
    )
    .await?;

    // dbg!(rewardsFinal);
    Ok(())
}

fn get_time_from_round(block_to_unix_time: &HashMap<u32, u32>, round: &u32) -> u32 {
    return *block_to_unix_time.get(round).unwrap();
}
fn update_balances(
    changed_escrows: &[String],
    change_time: &u32,
    escrow_to_balance: &mut HashMap<String, u64>,
    escrow_time_to_balance: &HashMap<EscrowTimeKey, u64>,
) {
    changed_escrows.iter().for_each(|escrow| {
        let key = EscrowTimeKey { escrow: String::from(escrow), unix_time: *change_time };
        let balance = escrow_time_to_balance.get(&key);
        escrow_to_balance.insert(String::from(escrow), *balance.unwrap());
    });
}

#[derive(Debug, Serialize)]
pub struct StateMachine<'a> {
    escrow_to_balance: HashMap<String, u64>,
    spreads: HashMap<u32, Spread>,
    owner_wallet_asset_to_quality_result:
        HashMap<String, HashMap<u32, OwnerWalletAssetQualityResult>>,
    owner_wallet_to_algx_balance: HashMap<&'a String, u64>,
    algo_price: f64,
    timestep: u32,
}

fn get_initial_balances(unix_time: u32, escrows: &[EscrowValue]) -> HashMap<String, u64> {
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

#[derive(Debug, Serialize, Deserialize)]
pub struct InitialState {
    algx_balance_data: Vec<CouchDBResult<AlgxBalanceValue>>,
    all_assets: Vec<u32>,
    all_assets_set: HashSet<u32>,
    #[serde(with = "any_key_map")]
    asset_id_to_escrows: HashMap<u32, Vec<String>>,
    #[serde(with = "any_key_map")]
    block_to_unix_time: HashMap<u32, u32>,
    env: HashMap<String, String>,
    epoch: u16,
    epoch_start: u32,
    epoch_end: u32,
    epoch_launch_time: u32,
    #[serde(with = "any_key_map")]
    escrow_time_to_balance: HashMap<EscrowTimeKey, u64>,
    tinyman_prices: Vec<PriceData>,
    #[serde(with = "any_key_map")]
    unix_time_to_changed_escrows: HashMap<u32, Vec<String>>,
    changed_escrow_seq: Vec<u32>,
    formatted_escrow_data: Vec<CouchDBResult<EscrowValue>>,
    escrow_addrs: Vec<String>,
    account_data: Vec<CouchDBResult<String>>,
    escrows: Vec<EscrowValue>,
    escrow_addr_to_data: HashMap<String, EscrowValue>,
}

fn get_seconds_in_epoch() -> u32 {
    604800
}

fn get_epoch_start(epoch: u16, epoch_launch_time: u32) -> u32 {
    let start = epoch_launch_time;
    let seconds_in_epoch = get_seconds_in_epoch();
    start + (seconds_in_epoch * ((epoch as u32) - 1))
}

fn get_epoch_end(epoch: u16, epoch_launch_time: u32) -> u32 {
    get_epoch_start(epoch, epoch_launch_time) + get_seconds_in_epoch()
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
