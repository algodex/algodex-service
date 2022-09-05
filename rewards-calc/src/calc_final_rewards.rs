use std::collections::HashMap;

use crate::{
    initial_state::get_seconds_in_epoch,
    quality_type::{EarnedAlgx, Quality},
    state_machine::StateMachine,
    update_owner_liquidity_quality::{
        EarnedAlgxEntry, MainnetPeriod, OwnerRewardsKey, OwnerWalletAssetQualityResult,
    },
};

fn get_total_quality(
    state_machine: &StateMachine,
    mainnet_period: &MainnetPeriod,
) -> (f64, HashMap<OwnerRewardsKey, EarnedAlgxEntry>) {
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
    (total_quality, owner_rewards_res_to_final_rewards_entry)
}

pub fn get_owner_rewards_res_to_final_rewards_entry(
    state_machine: &StateMachine,
    mainnet_period: &MainnetPeriod,
) -> HashMap<OwnerRewardsKey, EarnedAlgxEntry> {
    let (total_quality, mut owner_rewards_res_to_final_rewards_entry) =
        get_total_quality(state_machine, mainnet_period);

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

    owner_rewards_res_to_final_rewards_entry
}
