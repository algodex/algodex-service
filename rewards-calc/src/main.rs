// Calculate Algodex Rewards
// Example:
//   cargo run --release -- --epoch=2

#[macro_use]
extern crate approx;
#[macro_use]
extern crate lazy_static;

use initial_state::InitialState;

use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::error::Error;
use std::fs::File;
use std::hash::{Hash, Hasher};
use std::io::Write;

mod state_machine;
mod structs;
mod epoch;
use crate::calc_final_rewards::get_owner_rewards_res_to_final_rewards_entry;
use crate::initial_state::{get_initial_state, save_initial_state};

use crate::state_machine::StateMachine;

use crate::update_owner_liquidity_quality::check_mainnet_period;
use structs::EscrowValue;
mod calc_final_rewards;
mod get_spreads;
mod initial_state;
mod quality_type;
mod query_couch;
mod update_owner_liquidity_quality;
mod update_spreads;
use get_spreads::get_spreads;

use update_spreads::update_spreads;
mod save_rewards;
use crate::save_rewards::save_rewards;

use crate::update_owner_liquidity_quality::OwnerWalletAssetQualityResult;

// use query_couch::query_couch_db2;

use rand::SeedableRng;
use rand_pcg::Pcg32;

use clap::Parser;

#[derive(Parser)]
#[clap(author, version, about, long_about = None)]
struct Cli {
    #[clap(short, long)]
    epoch: u16,
    #[clap(short, long)]
    debug: u8,
}

lazy_static! {
    static ref DEBUG: bool = Cli::parse().debug == 1;
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

fn calculate_hash<T: Hash>(t: &T) -> u64 {
    let mut s = DefaultHasher::new();
    t.hash(&mut s);
    s.finish()
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let initial_state: InitialState = get_initial_state().await.unwrap();

    if *DEBUG {
        save_initial_state(&initial_state);
    }
    // IF SAVE DEBUG

    // let epoch_start = initial_state.epoch_start;
    // let epoch_end = initial_state.epoch_end;
    // let epoch = initial_state.epoch;

    let seed = calculate_hash(initial_state.env.get("REWARDS_RANDOM_SEED").unwrap());

    // Use the couchdb url to seed the random number generator, since it contains a password

    let mut state_machine = StateMachine::new(&initial_state);

    let mut rng = Pcg32::seed_from_u64(seed);

    while state_machine.run_step(&initial_state, &mut rng) {
        // This will break automatically at the end by returning false
    }

    let mainnet_period = check_mainnet_period(&initial_state.epoch_end);

    let owner_rewards_res_to_final_rewards_entry =
        get_owner_rewards_res_to_final_rewards_entry(&state_machine, &mainnet_period);
    // rewardsFinal.sort_by(|a, b| a.qualityFinal.val().partial_cmp(&b.qualityFinal.val()).unwrap());

    println!("saving rewards in DB!");
    save_rewards(
        initial_state.epoch,
        &state_machine.owner_wallet_asset_to_quality_result,
        &owner_rewards_res_to_final_rewards_entry,
    )
    .await?;

    // dbg!(rewardsFinal);
    Ok(())
}
