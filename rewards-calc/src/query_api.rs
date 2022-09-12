use std::time::Duration;

use serde::de::DeserializeOwned;

use std::error::Error;

pub async fn query_get_api<T: DeserializeOwned + Default>(
    proxy_url: &String,
) -> Result<T, Box<dyn Error>> {
    let client = reqwest::Client::new();

    println!("proxy url: {}", proxy_url);

    let mut attempts = 0;
    loop {
        let resp = client
            .get(proxy_url)
            //.header(reqwest::header::CONTENT_TYPE, "application/json")
            // .json(&queries)
            .send()
            .await;

        if let Ok(ok_res) = resp {
            if ok_res.status() == 200 {
                let res = ok_res.text().await?;

                let result = serde_json::from_str(&res);
                //return Err("Error...".into());
                return Ok(result?);
            }
            println!("error in result. sleeping 1 second and trying again");
            tokio::time::sleep(Duration::from_secs(1)).await;
            attempts += 1;
        }
        if attempts > 15 {
            return Err(format!("Error - could not fetch {} after 15 attempts.", proxy_url).into());
        }
    }
}
