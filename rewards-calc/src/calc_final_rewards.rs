use std::collections::{HashMap, HashSet};

use crate::{
    epoch::get_seconds_in_epoch,
    quality_type::{EarnedAlgx, Quality},
    state_machine::StateMachine,
    update_owner_liquidity_quality::{
        EarnedAlgxEntry, MainnetPeriod, OwnerRewardsKey, OwnerWalletAssetQualityResult,
    },
};

lazy_static! {
    static ref US_LISTED_ASSETS_SET:HashSet<u32> = {
        let mut s = HashSet::new();
        s.insert(31566704); //USDC
        s.insert(465865291); //STBL

        s.insert(386192725); //goBTC
        s.insert(386195940); //goETH
        s.insert(793124631); //gALGO
        s.insert(441139422); //goMINT
        s.insert(312769); //USDT
        s
    };
}

fn get_asset_grade_multiplier(asset_id: &u32) -> u8 {
    if US_LISTED_ASSETS_SET.contains(asset_id) {
        return 3;
    }
    if *asset_id == 724480511 { // ALGX gives 2x rewards
        return 2;
    }
    return 1;
}

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
                let asset_grade = get_asset_grade_multiplier(asset_id);
                let quality_final = Quality::from(match mainnet_period {
                    MainnetPeriod::Version1 => {
                        quality_sum.val().powf(0.5) * uptimef64.powi(5) * depth.val().powf(0.3)
                    }
                    MainnetPeriod::Version2 => {
                        quality_sum.val().powf(0.5)
                            * uptimef64.powi(5)
                            * depth.val().powf(0.3)
                            * algx_avg.powf(0.2)
                            * asset_grade as f64
                    }
                });
                let owner_rewards_key =
                    OwnerRewardsKey { wallet: owner_wallet.clone(), asset_id: *asset_id };
                let earned_algx_entry =
                    EarnedAlgxEntry { quality: quality_final, earned_algx: EarnedAlgx::from(0.0) };

                owner_rewards_res_to_final_rewards_entry
                    .insert(owner_rewards_key, earned_algx_entry);
                total_quality + quality_final.val()
            });
            total_quality + quality
        },
    );
    (total_quality, owner_rewards_res_to_final_rewards_entry)
}

/// Unformatted ALGX rewarded total per epoch
fn get_formatted_epoch_rewards(epoch: u16) -> f64 {
    let algx = match epoch {
        1..=2 => 18_000_000.0,
        3..=12 => 9_000_000.0,
        _ => 3_819_600.0,
    };
    algx
}
pub fn get_owner_rewards_res_to_final_rewards_entry(
    epoch: u16,
    state_machine: &StateMachine,
    mainnet_period: &MainnetPeriod,
) -> HashMap<OwnerRewardsKey, EarnedAlgxEntry> {
    let (total_quality, mut owner_rewards_res_to_final_rewards_entry) =
        get_total_quality(state_machine, mainnet_period);

    let total_epoch_rewards = get_formatted_epoch_rewards(epoch);
    // dbg!(&state_machine.owner_wallet_asset_to_quality_result);

    state_machine.owner_wallet_asset_to_quality_result.keys().for_each(|owner_wallet| {
        let owner_asset_entries =
            state_machine.owner_wallet_asset_to_quality_result.get(owner_wallet).unwrap();
        owner_asset_entries.keys().for_each(|asset_id| {
            let _asset_quality_entry = owner_asset_entries.get(asset_id).unwrap();
            let final_rewards_entry = owner_rewards_res_to_final_rewards_entry
                .get_mut(&OwnerRewardsKey { wallet: owner_wallet.clone(), asset_id: *asset_id })
                .unwrap();

            final_rewards_entry.earned_algx = EarnedAlgx::from(
                (total_epoch_rewards * final_rewards_entry.quality.val() / total_quality)
                    as f64,
            );
        });
    });

    owner_rewards_res_to_final_rewards_entry
}
