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
use crate::OwnerRewardsResult;
use crate::update_rewards::{OwnerRewardsKey, EarnedAlgxEntry};
use serde_json::json;
use serde_with::serde_as; // 1.5.1
use serde_json_any_key::*;

#[derive(Serialize, Debug)]
struct SaveRewardsEntry {
  #[serde(with = "any_key_map")]
  owner_rewards: HashMap<String,HashMap<u32,OwnerRewardsResult>>,
  #[serde(with = "any_key_map")]
  ownerRewardsResToFinalRewardsEntry: HashMap<OwnerRewardsKey,EarnedAlgxEntry>
}

pub async fn save_rewards(owner_rewards: &HashMap<String,HashMap<u32,OwnerRewardsResult>>,
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
    ownerRewardsResToFinalRewardsEntry: ownerRewardsResToFinalRewardsEntry_copy
  };

  let json = serde_json::to_string(&save_entry).unwrap();
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