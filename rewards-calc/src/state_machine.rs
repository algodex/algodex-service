use std::collections::HashSet;

use rand::Rng;
use rand_pcg::Lcg64Xsh32;

use crate::{InitialState, StateMachine, get_time_from_round, update_balances, update_spreads, update_owner_liquidity_quality::update_owner_wallet_quality_per_asset, save_state_machine, DEBUG};

pub fn loop_state_machine(state_machine: &mut StateMachine, initial_state: &InitialState,
    rng: &mut Lcg64Xsh32) -> bool {
  let cur_minute = state_machine.timestep / 60;
  state_machine.timestep = ((cur_minute + 1) * 60) + rng.gen_range(0..60);
  let mut escrow_did_change = false;
  // let ownerWalletsBalanceChangeSet:HashSet<String> = HashSet::new();
  
  while state_machine.owner_wallet_step < initial_state.algx_balance_data.len() {
      let owner_balance_entry = &initial_state.algx_balance_data[state_machine.owner_wallet_step];
      let owner_wallet_time = get_time_from_round(
          &initial_state.block_to_unix_time,
          &owner_balance_entry.value.round,
      );
      if owner_wallet_time > state_machine.timestep {
          break;
      }
      let wallet = owner_balance_entry.key.strval().clone();
      state_machine
          .owner_wallet_to_algx_balance
          .insert(wallet, owner_balance_entry.value.balance);
      state_machine.owner_wallet_step += 1;
  }

  // Price steps
  while state_machine.algo_price_step < initial_state.tinyman_prices.len() {
      let price_entry = &initial_state.tinyman_prices[state_machine.algo_price_step];
      if price_entry.unix_time > state_machine.timestep {
          break;
      }
      state_machine.algo_price = price_entry.price;
      state_machine.algo_price_step += 1;
  }

  while state_machine.escrow_step < initial_state.changed_escrow_seq.len()
      && initial_state.changed_escrow_seq[state_machine.escrow_step] <= state_machine.timestep
  {
      let change_time = &initial_state.changed_escrow_seq[state_machine.escrow_step];
      let changed_escrows =
          initial_state.unix_time_to_changed_escrows.get(change_time).unwrap();
      escrow_did_change = true;
      update_balances(
          changed_escrows,
          change_time,
          &mut state_machine.escrow_to_balance,
          &initial_state.escrow_time_to_balance,
      );
      state_machine.escrow_step += 1;
  }

  if escrow_did_change {
      update_spreads(&initial_state, state_machine);
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
      update_owner_wallet_quality_per_asset(asset_id, state_machine, initial_state);
  });
  println!(
      "{}",
      (state_machine.timestep as f64 - initial_state.epoch_start as f64)
          / (initial_state.epoch_end as f64 - initial_state.epoch_start as f64)
          * 100.0
  );

  if state_machine.timestep >= initial_state.epoch_end {
      return false;
  }

  if *DEBUG && initial_state.epoch == 2 {
      println!("saving state at: {}", state_machine.timestep);
      save_state_machine(&state_machine);
  }
  true
}