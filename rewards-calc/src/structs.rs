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

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CouchDBResultsType<T> {
    Ungrouped(Vec<CouchDBResp<T>>),
    Grouped(Vec<CouchDBGroupedResp<T>>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CouchDBKey {
    StringVal(String),
    VecU64Val(Vec<u64>),
}
impl CouchDBKey {
    pub fn strval(&self) -> &String {
        if let CouchDBKey::StringVal(c) = self {
            c
        } else {
            panic!("Not a String inside CouchDBKey")
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouchDBOuterResp<T> {
    pub results: CouchDBResultsType<T>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouchDBOuterResp2<T> {
    pub results: Vec<CouchDBResp<T>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouchDBGroupedResp<T> {
    pub rows: Vec<CouchDBGroupedResult<T>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouchDBResp<T> {
    pub total_rows: u32,
    pub offset: u32,
    pub rows: Vec<CouchDBResult<T>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouchDBGroupedResult<T> {
    pub key: String,
    pub value: T,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouchDBResult<T> {
    pub key: CouchDBKey,
    pub value: T,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EscrowValue {
    #[serde(rename = "_id")]
    pub id: String,
    #[serde(rename = "_rev")]
    pub rev: String,
    pub data: Data,
    #[serde(rename = "type")]
    pub type_field: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AlgxBalanceValue {
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
    pub rev: Option<String>,
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
    pub group: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Queries {
    pub queries: Vec<Keys>,
}

#[derive(Eq, Hash, PartialEq, Debug, Serialize, Deserialize)]
pub struct EscrowTimeKey {
    pub escrow: String,
    pub unix_time: u32,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TinymanTrade {
    pub round: u32,
    pub pool_xfer_asset_id: u32,
    pub user_xfer_asset_id: u32,
    #[serde(rename = "unix_time")]
    pub unix_time: u32,
    pub pool_xfer_type: String,
    pub pool_xfer_amount: u64,
    pub user_xfer_amount: u64,
    pub user_xfer_type: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlgodexAssetTVL {
    pub asset_id: u32,
    #[serde(rename = "formattedAlgoTVL")]
    pub formatted_algo_tvl: f64,
    #[serde(rename = "formattedAssetTVL")]
    pub formatted_asset_tvl: f64,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VestigeFiAsset {
    pub id: u32,
    pub name: String,
    pub ticker: String,
    pub verified: bool,
    #[serde(rename = "created_round")]
    pub created_round: i64,
    #[serde(rename = "first_pool_round")]
    pub first_pool_round: i64,
    pub price: f64,
    pub change1h: f64,
    pub change24h: f64,
    pub volume24h: f64,
    pub tvl: f64,
    #[serde(rename = "tvl_stable")]
    pub tvl_stable: f64,
    pub views1h: i64,
    pub views24h: i64,
    #[serde(rename = "market_cap")]
    pub market_cap: f64,
    pub fdmc: f64,
    pub dexes: Vec<String>,
}

