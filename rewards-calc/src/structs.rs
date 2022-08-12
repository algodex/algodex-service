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
    indexer_info: IndexerInfo,
    #[serde(rename = "escrowInfo")]
    escrow_info: EscrowInfo,
    #[serde(rename = "lastUpdateUnixTime")]
    last_update_unix_time: i64,
    #[serde(rename = "lastUpdateRound")]
    last_update_round: i64,
    #[serde(rename = "assetDecimals")]
    asset_decimals: i64,
    history: Vec<History>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EscrowInfo {
    #[serde(rename = "isAlgoBuyEscrow")]
    is_algo_buy_escrow: bool,
    apat: Option<Vec<String>>,
    #[serde(rename = "type")]
    escrow_info_type: String,
    #[serde(rename = "orderInfo")]
    order_info: String,
    numerator: i64,
    #[serde(rename = "assetId")]
    asset_id: i64,
    denominator: i64,
    minimum: i64,
    price: f64,
    #[serde(rename = "ownerAddr")]
    owner_addr: String,
    block: String,
    ts: i64,
    version: String,
    status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct History {
    #[serde(rename = "algoAmount")]
    algo_amount: Option<i64>,
    asa_amount: Option<i64>,
    round: i64,
    time: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IndexerInfo {
    #[serde(rename = "_id")]
    id: String,
    #[serde(rename = "_rev")]
    rev: String,
    address: String,
    #[serde(rename = "algoAmount")]
    algo_amount: i64,
    round: i64,
    #[serde(rename = "asaAmount")]
    asa_amount: i64,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct Keys {
    pub keys: Vec<String>
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Queries {
    pub queries: Vec<Keys>,
}
