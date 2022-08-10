use dotenv;
use std::collections::HashMap;
use urlencoding::encode;
use reqwest;
use serde::{Serialize, Deserialize};
use serde_json;

#[derive(Deserialize, Debug)]
struct CouchDBResp {
    total_rows: u32,
    offset: u32,
    rows: Vec<CouchDBResult>,
}

#[derive(Deserialize, Debug)]
struct CouchDBResult {
    key: String,
    value: String,
    id: String
}

async fn query_couch_db(couch_url: &String, db_name: &String, index_name: &String, 
    view_name: &String, keys: &Vec<String>)
    -> Result<CouchDBResp, Box<dyn std::error::Error>> {

    let query = serde_json::to_string(keys).unwrap();
    let query_encoded = encode(query.as_str());

    let full = format!("{}/{}/_design/{}/_view/{}?keys={}",
        couch_url, db_name, index_name, view_name, query_encoded);

    let resp = reqwest::get(full).await?;

    let result: CouchDBResp = resp.json().await?;

    return Ok(result);
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::from_filename(".env").expect(".env file can't be found!");
    let result = dotenv::vars().fold(HashMap::new(), |mut map, val| {
        map.insert(val.0, val.1);
        map
    });
    // println!("{:?}", result.get("ALGORAND_NETWORK").take());

    let couch_dburl = result.get("COUCHDB_BASE_URL").expect("Missing COUCHDB_BASE_URL");
    let keys = [String::from("1")].to_vec();
    let result = query_couch_db(&couch_dburl,
        &String::from("formatted_escrow"),
        &String::from("formatted_escrow"),
        &String::from("epochs"), &keys).await;
    println!("{:?}", result);
    Ok(())
}
