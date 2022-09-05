use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::update_owner_liquidity_quality::{EarnedAlgxEntry, OwnerRewardsKey};
use crate::{OwnerWalletAssetQualityResult, DEBUG};
use reqwest::Response;
use std::error::Error;

// 1.5.1
use crate::quality_type::{AlgxBalance, Depth, EarnedAlgx, Quality, Uptime};
use serde_json_any_key::*;
use std::fs::File;
use std::io::prelude::*;

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct SaveRewardsEntry {
    #[serde(with = "any_key_map")]
    owner_rewards: HashMap<String, HashMap<u32, OwnerWalletAssetQualityResult>>,
    #[serde(with = "any_key_map")]
    owner_rewards_res_to_final_rewards_entry: HashMap<OwnerRewardsKey, EarnedAlgxEntry>,
    epoch: u16,
}

pub async fn save_rewards(
    epoch: u16,
    owner_rewards: &HashMap<String, HashMap<u32, OwnerWalletAssetQualityResult>>,
    owner_rewards_res_to_final_rewards_entry: &HashMap<OwnerRewardsKey, EarnedAlgxEntry>,
) -> Result<Response, Box<dyn Error>> {
    let client = reqwest::Client::new();
    let full_url = format!("{}/save_rewards", "http://localhost:3006");

    // This cloning is ugly, so refactor in future
    let owner_copy: HashMap<String, HashMap<u32, OwnerWalletAssetQualityResult>> =
        owner_rewards.clone();
    let owner_rewards_res_to_final_rewards_entry_copy: HashMap<OwnerRewardsKey, EarnedAlgxEntry> =
        owner_rewards_res_to_final_rewards_entry.clone();

    let save_entry = SaveRewardsEntry {
        owner_rewards: owner_copy,
        owner_rewards_res_to_final_rewards_entry: owner_rewards_res_to_final_rewards_entry_copy,
        epoch,
    };

    let json = serde_json::to_string(&save_entry).unwrap();

    if epoch == 2 && *DEBUG {
        let filename = format!("integration_test/epoch_{}.json", epoch);
        println!("filename is: {}", filename);
        let mut file = File::create(filename).expect("Unable to create file");
        file.write_all(json.as_bytes()).expect("Unable to write to file");
    }
    // dbg!(json2);

    // let json = json!(save_entry);

    // println!("{json}");

    println!("rewards length is:{}", owner_rewards.keys().len());
    let resp = client
        .post(full_url)
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .body(json.to_string())
        // .json(&save_entry)
        .send()
        .await?;

    Ok(resp)
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct FlattenedFinalRewardsEntry {
    asset_id: u32,
    owner_wallet: String,
    final_quality: Quality,
    earned_algx: EarnedAlgx,
    algx_balance_sum: AlgxBalance,
    quality_sum: Quality,
    uptime: Uptime,
    depth: Depth,
    has_bid: bool,
    has_ask: bool,
}

#[cfg(test)]
mod tests {

    use std::{fs::File, io::Read};

    use pretty_assertions::assert_eq;

    use crate::update_owner_liquidity_quality::OwnerWalletAssetQualityResult;

    use super::{FlattenedFinalRewardsEntry, SaveRewardsEntry};

    fn get_compare_data_from_file(filename: &str) -> Vec<FlattenedFinalRewardsEntry> {
        let mut test_data = String::new();
        let mut test_file = File::open(filename).expect("Unable to open file");
        test_file.read_to_string(&mut test_data).expect("Unable to read string");

        let test_data_entry: SaveRewardsEntry = serde_json::from_str(&test_data).unwrap();

        get_flattened_data(&test_data_entry)
    }

    #[test]
    fn validate_epoch_2() {
        let flattened_test_data = get_compare_data_from_file("integration_test/epoch_2.json");
        let flattened_validate_data =
            get_compare_data_from_file("integration_test/epoch_2_validate.json");

        assert_eq!(flattened_test_data, flattened_validate_data);
    }

    fn get_flattened_data(final_entry: &SaveRewardsEntry) -> Vec<FlattenedFinalRewardsEntry> {
        let mut final_rewards_entries: Vec<FlattenedFinalRewardsEntry> = final_entry
            .owner_rewards_res_to_final_rewards_entry
            .keys()
            .map(|owner_rewards_key| {
                let asset_id = owner_rewards_key.asset_id;
                let wallet = &owner_rewards_key.wallet;
                let final_rewards = final_entry
                    .owner_rewards_res_to_final_rewards_entry
                    .get(owner_rewards_key)
                    .unwrap();
                let owner_rewards_entry =
                    final_entry.owner_rewards.get(wallet).unwrap().get(&asset_id).unwrap();

                let OwnerWalletAssetQualityResult {
                    algx_balance_sum,
                    quality_sum,
                    uptime,
                    depth,
                    has_bid,
                    has_ask,
                    ..
                } = *owner_rewards_entry;

                FlattenedFinalRewardsEntry {
                    asset_id,
                    owner_wallet: wallet.clone(),
                    final_quality: final_rewards.quality,
                    earned_algx: final_rewards.earned_algx,
                    algx_balance_sum,
                    quality_sum,
                    uptime,
                    depth,
                    has_bid,
                    has_ask,
                }
            })
            .collect();

        final_rewards_entries
            .sort_unstable_by_key(|item| (item.owner_wallet.clone(), item.asset_id));
        final_rewards_entries
    }
}
