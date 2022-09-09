use std::collections::{HashMap, HashSet};

use rand::Rng;
use rand_pcg::Lcg64Xsh32;
use serde::Serialize;

use crate::{
    get_spreads::{get_spreads, Spread},
    initial_state::{get_initial_balances, get_time_from_round},
    save_state_machine,
    structs::EscrowTimeKey,
    update_owner_liquidity_quality::{
        update_owner_wallet_quality_per_asset, OwnerWalletAssetQualityResult,
    },
    update_spreads, InitialState, DEBUG,
};

#[derive(Debug, Serialize)]
pub struct StateMachine {
    pub escrow_to_balance: HashMap<String, u64>,
    pub spreads: HashMap<u32, Spread>,
    pub owner_wallet_asset_to_quality_result:
        HashMap<String, HashMap<u32, OwnerWalletAssetQualityResult>>,
    pub owner_wallet_to_algx_balance: HashMap<String, u64>,
    pub algo_price: f64,
    pub timestep: u32,
    pub owner_wallet_step: usize,
    pub algo_price_step: usize,
    pub escrow_step: usize,
}

impl StateMachine {
    pub fn new(initial_state: &InitialState) -> StateMachine {
        let timestep = initial_state.epoch_start;
        let escrow_to_balance = get_initial_balances(timestep, &initial_state.escrows);
        let spreads = get_spreads(&escrow_to_balance, &initial_state.escrow_addr_to_data);

        StateMachine {
            escrow_to_balance,
            owner_wallet_to_algx_balance: HashMap::new(),
            owner_wallet_asset_to_quality_result: HashMap::new(),
            spreads,
            algo_price: 0.0,
            timestep,
            owner_wallet_step: 0,
            algo_price_step: 0,
            escrow_step: 0,
        }
    }
    fn update_owner_wallet_algx_balances(&mut self, initial_state: &InitialState) {
        let InitialState{algx_balance_data, block_to_unix_time, ..} = initial_state;

        while self.owner_wallet_step < algx_balance_data.len() {
            let owner_balance_entry = &algx_balance_data[self.owner_wallet_step];
            let owner_wallet_time = get_time_from_round(
                block_to_unix_time,
                &owner_balance_entry.value.round,
            );
            if owner_wallet_time > self.timestep {
                break;
            }
            let wallet = owner_balance_entry.key.strval().clone();
            self.owner_wallet_to_algx_balance.insert(wallet, owner_balance_entry.value.balance);
            self.owner_wallet_step += 1;
        }
    }

    fn update_algx_price(&mut self, initial_state: &InitialState) {
        let InitialState{tinyman_prices, ..} = initial_state;

        while self.algo_price_step < tinyman_prices.len() {
            let price_entry = &tinyman_prices[self.algo_price_step];
            if price_entry.unix_time > self.timestep {
                break;
            }
            self.algo_price = price_entry.price;
            self.algo_price_step += 1;
        }
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

    fn update_escrow_balances(&mut self, initial_state: &InitialState) -> bool {
        let InitialState{changed_escrow_seq, unix_time_to_changed_escrows,
            escrow_time_to_balance, ..} = initial_state;
        let mut escrow_did_change = false;
        while self.escrow_step < changed_escrow_seq.len()
            && changed_escrow_seq[self.escrow_step] <= self.timestep
        {
            let change_time = &changed_escrow_seq[self.escrow_step];
            let changed_escrows =
                unix_time_to_changed_escrows.get(change_time).unwrap();
            escrow_did_change = true;
            Self::update_balances(
                changed_escrows,
                change_time,
                &mut self.escrow_to_balance,
                escrow_time_to_balance,
            );
            self.escrow_step += 1;
        }
        escrow_did_change
    }

    fn get_assets_with_balances(&mut self, initial_state: &InitialState) -> HashSet<u32> {
        let assets_with_balances: HashSet<u32> =
            self.escrow_to_balance.keys().fold(HashSet::new(), |mut set, escrow| {
                let asset_id = initial_state
                    .escrow_addr_to_data
                    .get(escrow)
                    .unwrap()
                    .data
                    .escrow_info
                    .asset_id;
                set.insert(asset_id);
                set
            });
        assets_with_balances
    }

    fn get_assets_with_tolerable_spreads(&mut self, initial_state: &InitialState) -> HashSet<u32> {
        let assets_with_tolerable_spreads: HashSet<u32> =
            self.spreads.keys().filter(|asset_id| {
                let spread = self.spreads.get(asset_id).unwrap();
                if (spread.ask.is_none() || spread.bid.is_none()) {
                    return false;
                }
                let ask = spread.ask.unwrap();
                let bid = spread.bid.unwrap();
                if ((ask - bid) / bid).abs() > 0.1 {
                    return false;
                }
                return true;
            }).cloned().collect();
        assets_with_tolerable_spreads
    }

    fn print_progress(&self, initial_state: &InitialState) {
        println!(
            "{}",
            (self.timestep as f64 - initial_state.epoch_start as f64)
                / (initial_state.epoch_end as f64 - initial_state.epoch_start as f64)
                * 100.0
        );
    }

    pub fn run_step(&mut self, initial_state: &InitialState, rng: &mut Lcg64Xsh32) -> bool {
        let cur_minute = self.timestep / 60;
        self.timestep = ((cur_minute + 1) * 60) + rng.gen_range(0..60);
        // let mut escrow_did_change = false;
        // let ownerWalletsBalanceChangeSet:HashSet<String> = HashSet::new();

        self.update_owner_wallet_algx_balances(initial_state);
        self.update_algx_price(initial_state);
        let escrow_did_change = self.update_escrow_balances(initial_state);

        if escrow_did_change {
            update_spreads(initial_state, self);
        }

        // let assets_with_balances = self.get_assets_with_balances(initial_state);
        let assets_with_tolerable_spreads = self.get_assets_with_tolerable_spreads(initial_state);
        assets_with_tolerable_spreads.into_iter().for_each(|asset_id| {
            update_owner_wallet_quality_per_asset(&asset_id, self, initial_state);
        });

        self.print_progress(initial_state);

        if self.timestep >= initial_state.epoch_end {
            return false;
        }

        if *DEBUG && initial_state.epoch == 2 {
            println!("saving state at: {}", self.timestep);
            save_state_machine(self);
        }
        true
    }
}
