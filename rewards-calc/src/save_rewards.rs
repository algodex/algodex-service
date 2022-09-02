use dotenv;
use core::panic;
use std::collections::HashMap;
use urlencoding::encode;
use reqwest;
use serde::{Serialize, Deserialize};
use serde::de::DeserializeOwned;
use serde_json;
use serde_path_to_error;
use std::error::Error;
use reqwest::Response;
use crate::{OwnerRewardsResult, DEBUG};
use crate::update_rewards::{OwnerRewardsKey, EarnedAlgxEntry};
use serde_json::json;
use serde_with::serde_as; // 1.5.1
use serde_json_any_key::*;
use std::fs::File;
use std::io::prelude::*;
use crate::{quality_type::{AlgxBalance, Quality, Uptime, Depth, EarnedAlgx}};


#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
struct SaveRewardsEntry {
  #[serde(with = "any_key_map")]
  owner_rewards: HashMap<String,HashMap<u32,OwnerRewardsResult>>,
  #[serde(with = "any_key_map")]
  ownerRewardsResToFinalRewardsEntry: HashMap<OwnerRewardsKey,EarnedAlgxEntry>,
  epoch: u16
}

pub async fn save_rewards(epoch: u16, owner_rewards: &HashMap<String,HashMap<u32,OwnerRewardsResult>>,
  ownerRewardsResToFinalRewardsEntry: &HashMap<OwnerRewardsKey,EarnedAlgxEntry>)
-> Result<Response, Box<dyn Error>> {
  let client = reqwest::Client::new();
  let fullUrl = format!("{}/save_rewards",
    "http://localhost:3006");

  // This cloning is ugly, so refactor in future
  let owner_copy:HashMap<String,HashMap<u32,OwnerRewardsResult>> = owner_rewards.clone();
  let ownerRewardsResToFinalRewardsEntry_copy:HashMap<OwnerRewardsKey,EarnedAlgxEntry> = 
    ownerRewardsResToFinalRewardsEntry.clone();

  let save_entry = SaveRewardsEntry{
    owner_rewards: owner_copy,
    ownerRewardsResToFinalRewardsEntry: ownerRewardsResToFinalRewardsEntry_copy,
    epoch
  };


  let json = serde_json::to_string(&save_entry).unwrap();

  if (epoch == 2 && DEBUG) {
    let filename = format!("integration_test/epoch_{}.json", epoch);
    println!("filename is: {}", filename);
    let mut file = File::create(filename).expect("Unable to create file");
    file.write_all(json.as_bytes()).expect("Unable to write to file");
  }
  // dbg!(json2);

  // let json = json!(save_entry);

  // println!("{json}");

  println!("rewards length is:{}", owner_rewards.keys().len());
  let resp = client.post(fullUrl)
    .header(reqwest::header::CONTENT_TYPE, "application/json")
    .body(json.to_string())
    // .json(&save_entry)
    .send()
    .await?;

  Ok(resp)
}

#[derive(Debug, PartialEq, Eq)]
struct FlattenedFinalRewardsEntry {
  asset_id: u32,
  owner_wallet: String,
  final_quality: Quality,
  earned_algx: EarnedAlgx,
  algxBalanceSum: AlgxBalance,
  qualitySum: Quality,
  uptime: Uptime,
  depth: Depth,
  has_bid: bool,
  has_ask: bool
}
fn get_flattened_data(final_entry: &SaveRewardsEntry) -> Vec<FlattenedFinalRewardsEntry> {
  let mut final_rewards_entries:Vec<FlattenedFinalRewardsEntry> = final_entry.ownerRewardsResToFinalRewardsEntry.keys().map(|owner_rewards_key| {
    let asset_id = owner_rewards_key.assetId;
    let wallet = &owner_rewards_key.wallet;
    let final_rewards = final_entry.ownerRewardsResToFinalRewardsEntry.get(owner_rewards_key).unwrap();
    let owner_rewards_entry = final_entry.owner_rewards.get(wallet).unwrap().get(&asset_id).unwrap();

    let OwnerRewardsResult { algxBalanceSum, qualitySum, uptime,
      depth, has_bid, has_ask, .. } = *owner_rewards_entry;

    return FlattenedFinalRewardsEntry {
      asset_id, owner_wallet: wallet.clone(), 
      final_quality: final_rewards.quality,
      earned_algx: final_rewards.earned_algx,
      algxBalanceSum, qualitySum, uptime,
      depth, has_bid, has_ask
    } 
  }).collect();

  final_rewards_entries.sort_unstable_by_key(|item| (item.owner_wallet.clone(), item.asset_id));
  final_rewards_entries
}

fn get_compare_data_from_file(filename: &str) -> Vec<FlattenedFinalRewardsEntry> {
  let mut test_data = String::new();
  let mut test_file = File::open(filename).expect("Unable to open file");
  test_file.read_to_string(&mut test_data).expect("Unable to read string");

  let test_data_entry: SaveRewardsEntry = serde_json::from_str(&test_data).unwrap();

  return get_flattened_data(&test_data_entry);
}


#[cfg(test)]
mod tests {
    use std::{fs::File, io::Read};

    use crate::{save_rewards::{SaveRewardsEntry, get_compare_data_from_file}, quality_type::{AlgxBalance, Quality, Uptime, Depth, EarnedAlgx}, update_rewards::OwnerRewardsResult};
    use pretty_assertions::{assert_eq, assert_ne};

    #[test]

    fn validate_epoch_2() {
      let flattened_test_data = get_compare_data_from_file("integration_test/epoch_2.json");
      let flattened_validate_data = get_compare_data_from_file("integration_test/epoch_2_validate.json");
      
      assert_eq!(flattened_test_data, flattened_validate_data);
    }
}


/*
pub async fn save_rewards<T: DeserializeOwned>(couch_url: &String, db_name: &String, index_name: &String, 
  view_name: &String, keys: &Vec<String>, group: bool)
  -> Result<(CouchDBOuterResp<T>), Box<dyn Error>> 
  {

  let client = reqwest::Client::new();

  let keys = Keys {
      keys: keys.clone(),
      group
  };
  let mut keysVec: Vec<Keys> = Vec::new();
  keysVec.push(keys);

  let queries = Queries {
      queries: keysVec,
  };

//   let keysStr = serde_json::to_string(&queries).unwrap();
  //println!("bbb {}",keysStr);
  // let jsonObj = serde_json::from_str(json).unwrap();
  //let query = serde_json::to
  //let query_encoded = encode(query.as_str());

//   println!("{}", keysStr);
  let full = format!("{}/{}/_design/{}/_view/{}/queries",
      couch_url, db_name, index_name, view_name);

  let resp = client.post(full)
      //.header(reqwest::header::CONTENT_TYPE, "application/json")
      .json(&queries)
      .send()
      .await?;

  let res = resp.text().await?;
  //let owned = res.to_owned();
  //let text: &'a String = &owned;
//   println!("aaa {}",&res[0..1000]);
  if (res.contains("\"error\":\"unauthorized\"")) {
    panic!("{res}");
  }

  let result: Result<CouchDBOuterResp<T>,_> = serde_json::from_str(&res);

  if let Err(_) = &result {
    println!("{res}");
    let jd = &mut serde_json::Deserializer::from_str(&res);
    let result2: Result<CouchDBOuterResp<T>, _> = serde_path_to_error::deserialize(jd);
    match &result2 {
        Ok(_) => {},
        Err(err) => {
            let path = err.path().to_string();
            dbg!(path);
        }
    }
  };


  //return Err("Error...".into());
  return Ok(result?);
}
*/