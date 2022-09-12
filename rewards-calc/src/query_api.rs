use core::panic;

use std::fs::File;
use std::io::Write;

use serde::de::DeserializeOwned;

use std::error::Error;
use std::{env, fs};

use crate::structs::CouchDBResp;
use crate::structs::{CouchDBGroupedResp, CouchDBKey, CouchDBResult, Keys, Queries};
use crate::DEBUG;

pub async fn query_get_api<T: DeserializeOwned>(
    proxy_url: &String,
) -> Result<T, Box<dyn Error>> {
    let client = reqwest::Client::new();

    println!("proxy url: {}", proxy_url);

    let resp = client
        .get(proxy_url)
        //.header(reqwest::header::CONTENT_TYPE, "application/json")
        // .json(&queries)
        .send()
        .await?;

    let res = resp.text().await?;

    let result = serde_json::from_str(&res);
    //return Err("Error...".into());
    Ok(result?)
}