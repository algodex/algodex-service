use std::collections::{HashMap, HashSet};

use rand::Rng;
use rand_pcg::Lcg64Xsh32;
use serde::Serialize;

use crate::{
    get_spreads::Spread,
    get_time_from_round, save_state_machine, update_balances,
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
    fn update_owner_wallet_algx_balances(&mut self, initial_state: &InitialState) {
        while self.owner_wallet_step < initial_state.algx_balance_data.len() {
            let owner_balance_entry = &initial_state.algx_balance_data[self.owner_wallet_step];
            let owner_wallet_time = get_time_from_round(
                &initial_state.block_to_unix_time,
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
        while self.algo_price_step < initial_state.tinyman_prices.len() {
            let price_entry = &initial_state.tinyman_prices[self.algo_price_step];
            if price_entry.unix_time > self.timestep {
                break;
            }
            self.algo_price = price_entry.price;
            self.algo_price_step += 1;
        }
    }

    fn update_escrow_balances(&mut self, initial_state: &InitialState) -> bool {
        let mut escrow_did_change = false;
        while self.escrow_step < initial_state.changed_escrow_seq.len()
            && initial_state.changed_escrow_seq[self.escrow_step] <= self.timestep
        {
            let change_time = &initial_state.changed_escrow_seq[self.escrow_step];
            let changed_escrows =
                initial_state.unix_time_to_changed_escrows.get(change_time).unwrap();
            escrow_did_change = true;
            update_balances(
                changed_escrows,
                change_time,
                &mut self.escrow_to_balance,
                &initial_state.escrow_time_to_balance,
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

        let assets_with_balances = self.get_assets_with_balances(initial_state);

        assets_with_balances.into_iter().for_each(|asset_id| {
            update_owner_wallet_quality_per_asset(&asset_id, self, initial_state);
        });

        self.print_progress(initial_state);

        if self.timestep >= initial_state.epoch_end {
            return false;
        }

        if *DEBUG && initial_state.epoch == 2 {
            println!("saving state at: {}", self.timestep);
            save_state_machine(&self);
        }
        true
    }
}
