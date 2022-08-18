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


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EscrowValue {
    #[serde(rename = "_id")]
    pub id: String,
    #[serde(rename = "_rev")]
    pub rev: String,
    pub data: Data,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AlgxBalanceValue {
    pub id: String,
    pub balance: u64,
    pub round: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Data {
    #[serde(rename = "indexerInfo")]
    pub indexer_info: IndexerInfo,
    #[serde(rename = "escrowInfo")]
    pub escrow_info: EscrowInfo,
    #[serde(rename = "lastUpdateUnixTime")]
    pub last_update_unix_time: u32,
    #[serde(rename = "lastUpdateRound")]
    pub last_update_round: u32,
    #[serde(rename = "assetDecimals")]
    pub asset_decimals: u8,
    pub history: Vec<History>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EscrowInfo {
    #[serde(rename = "isAlgoBuyEscrow")]
    pub is_algo_buy_escrow: bool,
    pub apat: Option<Vec<String>>,
    #[serde(rename = "type")]
    pub escrow_info_type: String,
    #[serde(rename = "orderInfo")]
    pub order_info: String,
    pub numerator: u64,
    #[serde(rename = "assetId")]
    pub asset_id: u32,
    pub denominator: u64,
    pub minimum: u8,
    pub price: f64,
    #[serde(rename = "ownerAddr")]
    pub owner_addr: String,
    pub block: String,
    pub ts: u32,
    pub version: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct History {
    #[serde(rename = "algoAmount")]
    pub algo_amount: Option<u64>,
    #[serde(rename = "asaAmount")]
    pub asa_amount: Option<u64>,
    pub round: u32,
    pub time: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IndexerInfo {
    #[serde(rename = "_id")]
    pub id: String,
    #[serde(rename = "_rev")]
    pub rev: String,
    pub address: String,
    #[serde(rename = "algoAmount")]
    pub algo_amount: u64,
    pub round: u32,
    #[serde(rename = "asaAmount")]
    pub asa_amount: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct BlockTime {
    pub id: String,
    pub key: String,
    pub value: u32,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct Keys {
    pub keys: Vec<String>,
    pub group: bool
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Queries {
    pub queries: Vec<Keys>
}


#[derive(Eq, Hash, PartialEq, Debug)]
pub struct EscrowTimeKey {
    pub escrow: String,
    pub unix_time: u32
}