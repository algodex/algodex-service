use serde::{Serialize, Deserialize};

#[derive(Deserialize, Debug)]
pub struct CouchDBOuterResp<T> {
    pub results: Vec<CouchDBResp<T>>,
}

#[derive(Deserialize, Debug)]
pub struct CouchDBResp<T> {
    pub total_rows: u32,
    pub offset: u32,
    pub rows: Vec<CouchDBResult<T>>,
}

#[derive(Deserialize, Debug)]
pub struct CouchDBResult<T> {
    pub key: String,
    pub value: T,
    pub id: String
}


#[derive(Debug, Serialize, Deserialize)]
pub struct EscrowValue {
    #[serde(rename = "_id")]
    pub id: String,
    #[serde(rename = "_rev")]
    pub rev: String,
    pub data: Data,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Data {
    #[serde(rename = "indexerInfo")]
    pub indexer_info: IndexerInfo,
    #[serde(rename = "escrowInfo")]
    pub escrow_info: EscrowInfo,
    #[serde(rename = "lastUpdateUnixTime")]
    pub last_update_unix_time: i64,
    #[serde(rename = "lastUpdateRound")]
    pub last_update_round: i64,
    #[serde(rename = "assetDecimals")]
    pub asset_decimals: i64,
    pub history: Vec<History>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EscrowInfo {
    #[serde(rename = "isAlgoBuyEscrow")]
    pub is_algo_buy_escrow: bool,
    pub apat: Option<Vec<String>>,
    #[serde(rename = "type")]
    pub escrow_info_type: String,
    #[serde(rename = "orderInfo")]
    pub order_info: String,
    pub numerator: i64,
    #[serde(rename = "assetId")]
    pub asset_id: i64,
    pub denominator: i64,
    pub minimum: i64,
    pub price: f64,
    #[serde(rename = "ownerAddr")]
    pub owner_addr: String,
    pub block: String,
    pub ts: i64,
    pub version: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct History {
    #[serde(rename = "algoAmount")]
    pub algo_amount: Option<i64>,
    pub asa_amount: Option<i64>,
    pub round: i64,
    pub time: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IndexerInfo {
    #[serde(rename = "_id")]
    pub id: String,
    #[serde(rename = "_rev")]
    pub rev: String,
    pub address: String,
    #[serde(rename = "algoAmount")]
    pub algo_amount: i64,
    pub round: i64,
    #[serde(rename = "asaAmount")]
    pub asa_amount: i64,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct Keys {
    pub keys: Vec<String>
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Queries {
    pub queries: Vec<Keys>,
}
