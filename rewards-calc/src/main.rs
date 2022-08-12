use dotenv;
use std::collections::HashMap;
use urlencoding::encode;
use reqwest;
use serde::{Serialize, Deserialize};
use serde::de::DeserializeOwned;
use serde_json;
use serde_path_to_error;
use std::error::Error;

mod structs;
use crate::structs::{CouchDBOuterResp, Keys, Queries, EscrowValue};

async fn query_couch_db<T: DeserializeOwned>(couch_url: &String, db_name: &String, index_name: &String, 
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

//aaa {"results":[
//{"total_rows":305541,"offset":71,"rows":[
//    {"id":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","key":"223ET2ZAGP4OGOGBSIJL7EF5QTVZ2TRP2D4KMGZ27DBFTIJHHXJH44R5OE","value":{

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    dotenv::from_filename(".env").expect(".env file can't be found!");
    let result = dotenv::vars().fold(HashMap::new(), |mut map, val| {
        map.insert(val.0, val.1);
        map
    });
    // println!("{:?}", result.get("ALGORAND_NETWORK").take());

    let couch_dburl = result.get("COUCHDB_BASE_URL").expect("Missing COUCHDB_BASE_URL");
    let keys = [String::from("1")].to_vec();
    let formatted_escrow_epochs = query_couch_db::<String>(&couch_dburl,
        &"formatted_escrow".to_string(),
        &"formatted_escrow".to_string(),
        &"epochs".to_string(), &keys).await;
    let resultRows = &formatted_escrow_epochs.unwrap().results[0].rows;
    let escrowAddrs:Vec<String> = resultRows.iter().map(|row| String::clone(&row.value)).collect();
    //println!("{:?}", escrowAddrs);
    
    let formatted_escrow_data = query_couch_db::<EscrowValue>(&couch_dburl,
        &"formatted_escrow".to_string(),
        &"formatted_escrow".to_string(),
        &"orderLookup".to_string(), &escrowAddrs).await;

    let firstResultRows = &formatted_escrow_data.unwrap().results[0].rows;
    let escrowAddrToData:HashMap<&String,&EscrowValue> = firstResultRows.iter().fold(HashMap::new(), |mut map, row| {
            map.insert(&row.id, &row.value);
            map
        });
    println!("{:?}", escrowAddrToData);
    //println!("{:?}", result);
    //let resultVal = result.unwrap();


    Ok(())
}
