use dotenv;
use std::collections::HashMap;
use urlencoding::encode;
use reqwest;
use serde::{Serialize, Deserialize};
use serde::de::DeserializeOwned;
use serde_json;
use serde_path_to_error;
use std::error::Error;

use crate::structs::{CouchDBOuterResp, Keys, Queries, EscrowValue};

pub async fn query_couch_db<T: DeserializeOwned>(couch_url: &String, db_name: &String, index_name: &String, 
  view_name: &String, keys: &Vec<String>)
  -> Result<(CouchDBOuterResp<T>), Box<dyn Error>> 
  {

  let client = reqwest::Client::new();

  let keys = Keys {
      keys: keys.clone()
  };
  let mut keysVec: Vec<Keys> = Vec::new();
  keysVec.push(keys);

  let queries = Queries {
      queries: keysVec
  };

  let keysStr = serde_json::to_string(&queries).unwrap();
  //println!("bbb {}",keysStr);
  // let jsonObj = serde_json::from_str(json).unwrap();
  //let query = serde_json::to
  //let query_encoded = encode(query.as_str());

  // println!("{}", query);
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
  let result: CouchDBOuterResp<T> = serde_json::from_str(&res)?;
      //let deserializer = &mut serde_json::Deserializer::from_str(&text);

  //let result: Result<CouchDBOuterResp<EscrowValue>, _> = serde_path_to_error::deserialize(deserializer);
  // dbg!(&result);

  // match result {
  //     Ok(_) => println!("Expected an error"),
  //     Err(err) => {
  //         panic!("{}", err);
  //     }
  // }

  //let result: CouchDBOuterResp = serde_json::from_str(&text)?;


  // //println!("aaa {}",&text[0..200]);
  // let result: CouchDBOuterResp = resp.json().await?;


  //return Err("Error...".into());
  return Ok(result);
}
