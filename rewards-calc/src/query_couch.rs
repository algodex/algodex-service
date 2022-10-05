use core::panic;

use std::fs::File;
use std::io::Write;

use serde::de::DeserializeOwned;

use std::error::Error;
use std::{env, fs};

use crate::structs::CouchDBResp;
use crate::structs::{CouchDBGroupedResp, CouchDBKey, CouchDBResult, Keys, Queries};
use crate::DEBUG;

pub async fn query_couch_db<T: DeserializeOwned>(
    proxy_url: &String,
    db_name: &String,
    index_name: &String,
    view_name: &String,
    keys: &[String],
    group: bool,
) -> Result<CouchDBResp<T>, Box<dyn Error>> {
    let client = reqwest::Client::new();

    let keys = Keys { keys: keys.to_vec(), group };
    let keys_vec: Vec<Keys> = vec![keys];

    let queries = Queries { queries: keys_vec };

    //   let keysStr = serde_json::to_string(&queries).unwrap();
    //println!("bbb {}",keysStr);
    // let jsonObj = serde_json::from_str(json).unwrap();
    //let query = serde_json::to
    //let query_encoded = encode(query.as_str());

    //   println!("{}", keysStr);
    println!("proxy url: {}", proxy_url);
    let full =
        format!("{}/query/{}/_design/{}/_view/{}", proxy_url, db_name, index_name, view_name);

    println!("full url: {}", full);

    let resp = client
        .post(full)
        //.header(reqwest::header::CONTENT_TYPE, "application/json")
        .json(&queries)
        .send()
        .await?;

    let res = resp.text().await?;

    if *DEBUG {
        let short_name = format!("{}_{}_view/{}/queries", db_name, index_name, view_name);
        let filename = format!("result_data/{}.txt", short_name.replace('/', "_"));
        println!("filename is: {}", filename);

        let full_path = env::current_dir()?.join(filename);

        let dir = "result_data";
        let full_dir = env::current_dir()?.join(dir);
        // println!("file is: {}", env::current_dir()?.join(filename).display());

        fs::create_dir_all(full_dir)?;

        // let srcdir = PathBuf::from("./src");
        // let full_canon = fs::canonicalize(&full_path);
        let os_path = full_path.into_os_string().into_string().unwrap();

        println!("full path {:?}", os_path);

        let mut file = File::create(os_path).expect("Unable to create file");
        file.write_all(res.as_bytes()).expect("Unable to write to file");
    }

    //let owned = res.to_owned();
    //let text: &'a String = &owned;
    //   println!("aaa {}",&res[0..1000]);
    if res.contains("\"error\":\"unauthorized\"") {
        panic!("{res}");
    }

    let result: Result<CouchDBResp<T>, _> = match group {
        false => serde_json::from_str(&res),
        true => {
            let grouped_resp: Result<CouchDBGroupedResp<T>, _> = serde_json::from_str(&res);
            let converted_rows: Vec<CouchDBResult<T>> = grouped_resp
                .unwrap()
                .rows
                .into_iter()
                .map(|row| CouchDBResult {
                    key: CouchDBKey::StringVal(row.key),
                    value: row.value,
                    id: "".to_string(),
                })
                .collect();
            let ungrouped: Result<CouchDBResp<T>, serde_json::Error> =
                Ok(CouchDBResp { rows: converted_rows, total_rows: 0, offset: 0 });
            ungrouped
        }
    };

    if result.is_err() {
        println!("{res}");
        let jd = &mut serde_json::Deserializer::from_str(&res);
        let result2: Result<CouchDBResp<T>, _> = serde_path_to_error::deserialize(jd);
        match &result2 {
            Ok(_) => {}
            Err(err) => {
                let path = err.path().to_string();
                dbg!(path);
            }
        }
    };
    //return Err("Error...".into());
    Ok(result?)
}

// This function works but is unused - delete?
// pub async fn query_couch_db_no_proxy<T: DeserializeOwned>(couch_url: &String, db_name: &String, index_name: &String,
//   view_name: &String, keys: &Vec<String>, group: bool)
//   -> Result<(CouchDBOuterResp<T>), Box<dyn Error>>
//   {

//   let client = reqwest::Client::new();

//   let keys = Keys {
//       keys: keys.clone(),
//       group
//   };
//   let mut keysVec: Vec<Keys> = Vec::new();
//   keysVec.push(keys);

//   let queries = Queries {
//       queries: keysVec,
//   };

// //   let keysStr = serde_json::to_string(&queries).unwrap();
//   //println!("bbb {}",keysStr);
//   // let jsonObj = serde_json::from_str(json).unwrap();
//   //let query = serde_json::to
//   //let query_encoded = encode(query.as_str());

// //   println!("{}", keysStr);
//   let full = format!("{}/{}/_design/{}/_view/{}/queries",
//       couch_url, db_name, index_name, view_name);

//   let resp = client.post(full)
//       //.header(reqwest::header::CONTENT_TYPE, "application/json")
//       .json(&queries)
//       .send()
//       .await?;

//   let res = resp.text().await?;

//   if (DEBUG) {
//     let short_name = format!("{}_{}_view/{}/queries", db_name, index_name, view_name);
//     let filename = format!("result_data/{}.txt", short_name.replace("/","_"));
//     println!("filename is: {}", filename);
//     let mut file = File::create(filename).expect("Unable to create file");
//     file.write_all(res.as_bytes()).expect("Unable to write to file");
//   }

//   //let owned = res.to_owned();
//   //let text: &'a String = &owned;
// //   println!("aaa {}",&res[0..1000]);
//   if (res.contains("\"error\":\"unauthorized\"")) {
//     panic!("{res}");
//   }

//   let result: Result<CouchDBOuterResp<T>,_> = serde_json::from_str(&res);

//   if let Err(_) = &result {
//     println!("{res}");
//     let jd = &mut serde_json::Deserializer::from_str(&res);
//     let result2: Result<CouchDBOuterResp<T>, _> = serde_path_to_error::deserialize(jd);
//     match &result2 {
//         Ok(_) => {},
//         Err(err) => {
//             let path = err.path().to_string();
//             dbg!(path);
//         }
//     }
//   };

//   //return Err("Error...".into());
//   return Ok(result?);
// }

pub async fn query_couch_db_with_full_str<T: DeserializeOwned>(
    couch_url: &String,
    db_name: &String,
    index_name: &String,
    view_name: &String,
    full_query_str: &String,
) -> Result<CouchDBResp<T>, Box<dyn Error>> {
    let client = reqwest::Client::new();

    let full = format!(
        "{}/{}/_design/{}/_view/{}?{}",
        couch_url, db_name, index_name, view_name, full_query_str
    );

    println!("{}", full);
    let resp = client
        .get(full)
        //.header(reqwest::header::CONTENT_TYPE, "application/json")
        .send()
        .await?;

    let res = resp.text().await?;
    // println!("{res}");

    if res.contains("\"error\":\"unauthorized\"") {
        panic!("{res}");
    }

    let result: Result<CouchDBResp<T>, _> = serde_json::from_str(&res);

    if result.is_err() {
        println!("{res}");
        let jd = &mut serde_json::Deserializer::from_str(&res);
        let result2: Result<CouchDBResp<T>, _> = serde_path_to_error::deserialize(jd);
        match &result2 {
            Ok(_) => {}
            Err(err) => {
                let path = err.path().to_string();
                dbg!(path);
            }
        }
    };

    Ok(result?)
}

// This is used for debugging since optionals dont work with serde json debugger
// pub async fn query_couch_db2<T: DeserializeOwned>(couch_url: &String, db_name: &String, index_name: &String,
//   view_name: &String, keys: &Vec<String>, group: bool)
//   -> Result<(CouchDBOuterResp2<T>), Box<dyn Error>>
//   {

//   let client = reqwest::Client::new();

//   let keys = Keys {
//       keys: keys.clone(),
//       group
//   };
//   let mut keysVec: Vec<Keys> = Vec::new();
//   keysVec.push(keys);

//   let queries = Queries {
//       queries: keysVec,
//   };

// //   let keysStr = serde_json::to_string(&queries).unwrap();
//   //println!("bbb {}",keysStr);
//   // let jsonObj = serde_json::from_str(json).unwrap();
//   //let query = serde_json::to
//   //let query_encoded = encode(query.as_str());

// //   println!("{}", keysStr);
//   let full = format!("{}/{}/_design/{}/_view/{}/queries",
//       couch_url, db_name, index_name, view_name);

//   let resp = client.post(full)
//       //.header(reqwest::header::CONTENT_TYPE, "application/json")
//       .json(&queries)
//       .send()
//       .await?;

//   let res = resp.text().await?;
//   //let owned = res.to_owned();
//   //let text: &'a String = &owned;
// //   println!("aaa {}",&res[0..1000]);
//   if (res.contains("\"error\":\"unauthorized\"")) {
//     panic!("{res}");
//   }

//   let result: Result<CouchDBOuterResp2<T>,_> = serde_json::from_str(&res);

//   if let Err(_) = &result {
//     println!("{res}");
//     let jd = &mut serde_json::Deserializer::from_str(&res);
//     let result2: Result<CouchDBOuterResp2<T>, _> = serde_path_to_error::deserialize(jd);
//     match &result2 {
//         Ok(_) => {},
//         Err(err) => {
//             let path = err.path().to_string();
//             dbg!(path);
//         }
//     }
//   };

//   //return Err("Error...".into());
//   return Ok(result?);
// }
