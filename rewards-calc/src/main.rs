use dotenv;
use std::collections::HashMap;
use urlencoding::encode;
use reqwest;
use serde::{Serialize, Deserialize};

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

//  {"key": "1", "value": "ZW6G62RBX7RQEX3IPVNYVPURUESD6NRUA5U3GG4YL2NP5SCIDXH66KB7X4", "id": "ZW6G62RBX7RQEX3IPVNYVPURUESD6NRUA5U3GG4YL2NP5SCIDXH66KB7X4"}, 



#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::from_filename(".env").expect(".env file can't be found!");
    let result = dotenv::vars().fold(HashMap::new(), |mut map, val| {
        map.insert(val.0, val.1);
        map
    });
    // println!("{:?}", result.get("ALGORAND_NETWORK").take());

    let couch_dburl = result.get("COUCHDB_BASE_URL").expect("Missing COUCHDB_BASE_URL");
    println!("{}", couch_dburl);

    let query = "[\"1\"]";
    let query_encoded = encode(query);
    //let full = format!("{}/formatted_escrow/_design/formatted_escrow/_view/epochs?keys=%5B%221%22%5D",
    //    couch_dburl);  // ["1"]
    let full = format!("{}/formatted_escrow/_design/formatted_escrow/_view/epochs?keys={}",
        couch_dburl, query_encoded);

    let resp = reqwest::get(full).await?;
    // let text = body.text().await?;
    // let slice = &text[..100];
    // println!("{}", slice);

    let result: CouchDBResp = resp.json().await?;

    println!("{:?}", result);
    Ok(())
}
