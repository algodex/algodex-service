/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

use dotenv;
use std::collections::HashMap;
use urlencoding::encode;
use reqwest;
use serde::{Serialize, Deserialize};
use serde::de::DeserializeOwned;
use serde_json;
use serde_path_to_error;
use std::error::Error;

// use crate::structs::{CouchDBOuterResp, Keys, Queries, EscrowValue};


#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CouchDBOuterResp {
    #[serde(rename = "total_rows")]
    pub total_rows: i64,
    pub offset: i64,
    pub rows: Vec<Row>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Row {
    pub id: String,
    pub key: String,
    pub value: Value,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Value {
    pub uptime: i64,
    pub depth_sum: f64,
    pub quality_sum: f64,
    pub algx_avg: i64,
    pub quality_final: f64,
    pub earned_rewards: i64,
    pub epoch: i64,
    pub asset_id: i64,
}



pub async fn query_couch_db(couch_url: &String, db_name: &String, index_name: &String, 
  view_name: &String, keys: &Vec<String>, group: bool)
  -> Result<CouchDBOuterResp, Box<dyn Error>> 
  {

  let client = reqwest::Client::new();

  // let keys = Keys {
  //     keys: keys.clone(),
  //     group
  // };
  // let mut keysVec: Vec<Keys> = Vec::new();
  // keysVec.push(keys);

  // let queries = Queries {
  //     queries: keysVec,
  // };

  let keysStr = serde_json::to_string(&keys).unwrap();
  //println!("bbb {}",keysStr);
  // let jsonObj = serde_json::from_str(json).unwrap();
  //let query = serde_json::to
  let query_encoded = encode(&keysStr);

//   println!("{}", keysStr);
  let full = format!("{}/{}/_design/{}/_view/{}?keys={}",
      couch_url, db_name, index_name, view_name, query_encoded);

  let resp = client.get(full)
      //.header(reqwest::header::CONTENT_TYPE, "application/json")
      //.json(&queries)
      .send()
      .await?;

  let res = resp.text().await?;

  let result: CouchDBOuterResp = serde_json::from_str(&res)?;

  //let owned = res.to_owned();
  //let text: &'a String = &owned;
//   println!("aaa {}",&res[0..1000]);

  //let result: CouchDBOuterResp<T> = serde_json::from_str(&res)?;
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


  // let result: CouchDBOuterResp = resp.json().await?;


  //return Err("Error...".into());
  return Ok(result);
}
