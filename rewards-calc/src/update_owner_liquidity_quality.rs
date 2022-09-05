use crate::InitialState;
use crate::StateMachine;

use core::panic;
use std::collections::HashMap;

use crate::quality_type::*;
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug)]
pub struct QualityResult {
    addr: String,
    quality: Quality,
    bid_depth: BidDepth,
    ask_depth: AskDepth,
    algx_balance: AlgxBalance,
}

#[derive(Debug, Serialize, Deserialize, Hash, Eq, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OwnerRewardsKey {
    pub wallet: String,
    pub asset_id: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EarnedAlgxEntry {
    pub quality: Quality,
    pub earned_algx: EarnedAlgx,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct OwnerWalletAssetQualityResult {
    pub algx_balance_sum: AlgxBalance,
    pub quality_sum: Quality,
    pub uptime: Uptime,
    pub depth: Depth,
    pub has_bid: bool,
    pub has_ask: bool,
}

impl Default for OwnerWalletAssetQualityResult {
    fn default() -> Self {
        Self {
            algx_balance_sum: AlgxBalance::from(0),
            quality_sum: Quality::from(0.0),
            uptime: Uptime::from(0),
            depth: Depth::from(0.0),
            has_bid: false,
            has_ask: false,
        }
    }
}
impl QualityResult {
    pub fn new(
        addr: String,
        quality: Quality,
        bid_depth: BidDepth,
        ask_depth: AskDepth,
        algx_balance: AlgxBalance,
    ) -> QualityResult {
        QualityResult { addr, quality, bid_depth, ask_depth, algx_balance }
    }
}

enum OrderType {
    Bid,
    Ask,
}

use OrderType::Ask;
use OrderType::Bid;

pub enum MainnetPeriod {
    Version1,
    Version2,
}

/// Get the current mainnet period. Either 1 or 2 based on the timestamp.
pub fn check_mainnet_period(unix_time: &u32) -> MainnetPeriod {
    // Thu Jun 02 2022 23:59:59 GMT-0400 (Eastern Daylight Time)
    if *unix_time < 1654228799 {
        MainnetPeriod::Version1
    } else {
        MainnetPeriod::Version2
    }
}

/// https://docs.algodex.com/rewards-program/algx-liquidity-rewards-program#initial-maximum-spreads
fn get_spread_multiplier(unix_time: &u32, percent_distant: &f64) -> f64 {
    let mainnet_period = check_mainnet_period(unix_time);
    if let MainnetPeriod::Version1 = mainnet_period {
        return 1.0;
    }
    let adj_percent = *percent_distant * 100.0;
    if adj_percent < 0.5 {
        return 10.0;
    } else if adj_percent < 1.0 {
        return 2.5;
    }

    1.0
}

/// Check if eligible for ALGX rewards
/// https://docs.algodex.com/rewards-program/algx-liquidity-rewards-program
fn check_is_eligible(
    percent_distant: &f64,
    order_type: &OrderType,
    depth: &f64,
    owner_algx_balance: &AlgxBalance,
    unix_time: &u32,
) -> bool {
    match check_mainnet_period(unix_time) {
        MainnetPeriod::Version1 => {
            if *percent_distant > 0.1 {
                // 10%
                return false;
            }
            if *depth < 15.0 && matches!(order_type, Bid) {
                //FIXME
                return false;
            }
            if *depth < 30.0 && matches!(order_type, Ask) {
                return false;
            }
            return true;
        }
        MainnetPeriod::Version2 => {
            if owner_algx_balance.val() < 3000 * 10u64.pow(6) {
                // FIXME change to 3000
                return false;
            }
            if *percent_distant > 0.05 {
                // 5%
                return false;
            }
            if *depth < 50.0 && matches!(order_type, Bid) {
                //FIXME
                return false;
            }
            if *depth < 100.0 && matches!(order_type, Ask) {
                return false;
            }
            return true;
        }
    };
}

/// Get the quality analytics for each escrow
fn get_analytics_per_escrow(
    inputted_asset_id: &u32,
    state_machine: &StateMachine,
    initial_state: &InitialState,
) -> Vec<QualityResult> {
    let StateMachine {
        escrow_to_balance,
        spreads,
        owner_wallet_to_algx_balance,
        algo_price,
        timestep,
        ..
    } = state_machine;
    let InitialState { escrow_addr_to_data, asset_id_to_escrows, .. } = initial_state;

    let quality_analytics: Vec<QualityResult> = asset_id_to_escrows
        .get(inputted_asset_id)
        .unwrap()
        .iter()
        //.map(|escrow| escrow.clone())
        .filter(|escrow| escrow_to_balance.get(*escrow).unwrap() > &0u64)
        .filter(|escrow| {
            let asset_id = &escrow_addr_to_data.get(*escrow).unwrap().data.escrow_info.asset_id;
            let spread = spreads.get(asset_id);
            if spread.is_none() || spread.unwrap().ask.is_none() || spread.unwrap().bid.is_none() {
                return false;
            }
            true
        })
        .map(|escrow| {
            let asset_id = &escrow_addr_to_data.get(escrow).unwrap().data.escrow_info.asset_id;
            let price = &escrow_addr_to_data.get(escrow).unwrap().data.escrow_info.price;
            let decimals = &escrow_addr_to_data.get(escrow).unwrap().data.asset_decimals;
            let balance = escrow_to_balance.get(escrow).unwrap();
            let owner_addr = &escrow_addr_to_data.get(escrow).unwrap().data.escrow_info.owner_addr;
            let owner_algx_balance =
                AlgxBalance::from(*owner_wallet_to_algx_balance.get(owner_addr).unwrap_or(&0u64));
            let spread = spreads.get(asset_id);
            if spread.is_none() || spread.unwrap().ask.is_none() || spread.unwrap().bid.is_none() {
                dbg!("{spread} {assetId}");
                panic!("Invalid spread!");
            }
            let ask = spread.unwrap().ask.unwrap();
            let bid = spread.unwrap().bid.unwrap();

            let mid_market = (ask + bid) / 2.0;
            let distance_from_spread = (price - mid_market).abs();
            let percent_distant = distance_from_spread / mid_market;
            let depth =
                (*algo_price) * (*balance as f64) * *price / (10_f64.powf(*decimals as f64) as f64);
            let order_type = match escrow_addr_to_data
                .get(escrow)
                .unwrap()
                .data
                .escrow_info
                .is_algo_buy_escrow
            {
                true => Bid,
                false => Ask,
            };

            let is_eligible = check_is_eligible(
                &percent_distant,
                &order_type,
                &depth,
                &owner_algx_balance,
                timestep,
            );
            let spread_multiplier = get_spread_multiplier(timestep, &percent_distant);
            let quality = match is_eligible {
                true => spread_multiplier * depth / (percent_distant + 0.0001),
                false => 0.0,
            };
            let bid_depth = match order_type {
                Bid => depth,
                _ => 0f64,
            };
            let ask_depth = match order_type {
                Ask => depth,
                _ => 0f64,
            };
            QualityResult {
                addr: escrow.clone(),
                quality: Quality::from(quality),
                bid_depth: BidDepth::from(bid_depth),
                ask_depth: AskDepth::from(ask_depth),
                algx_balance: owner_algx_balance,
            }
        })
        .collect();
    quality_analytics
}

/// Calculate the quality of each owner wallet from the per escrow quality entries
fn get_owner_wallet_to_quality<'a>(
    initial_state: &'a InitialState,
    quality_analytics: &'a [QualityResult],
) -> HashMap<&'a String, QualityResult> {
    let InitialState { ref escrow_addr_to_data, .. } = initial_state;

    let owner_wallet_to_quality: HashMap<&String, QualityResult> = quality_analytics
        .iter()
        .filter(|entry| entry.quality.val() > 0.0)
        .fold(HashMap::new(), |mut owner_wallet_to_quality, entry| {
            let owner_addr =
                &escrow_addr_to_data.get(&entry.addr).unwrap().data.escrow_info.owner_addr;

            let quality_data_opt = owner_wallet_to_quality.get(owner_addr);
            if quality_data_opt.is_none() {
                owner_wallet_to_quality.insert(
                    owner_addr,
                    QualityResult {
                        addr: owner_addr.clone(),
                        quality: Quality::from(0.0),
                        bid_depth: BidDepth::from(0.0),
                        ask_depth: AskDepth::from(0.0),
                        algx_balance: AlgxBalance::from(0),
                    },
                );
            }

            let quality_entry = owner_wallet_to_quality.get_mut(owner_addr).unwrap();
            quality_entry.quality += entry.quality;
            quality_entry.bid_depth += entry.bid_depth;
            quality_entry.ask_depth += entry.ask_depth;
            quality_entry.algx_balance += entry.algx_balance;
            owner_wallet_to_quality
        });
    owner_wallet_to_quality
}

/// For this unix time step, update the owner wallet quality which will later
/// be used to calculate the ALGX rewards
fn update_owner_wallet_quality(
    owner_wallet_asset_to_rewards: &mut HashMap<
        String,
        HashMap<u32, OwnerWalletAssetQualityResult>,
    >,
    owner_wallet_to_quality: &HashMap<&String, QualityResult>,
    asset_id: &u32,
    unix_time: &u32,
    total_bid_depth: &BidDepth,
    total_ask_depth: &AskDepth,
) {
    owner_wallet_to_quality.keys().for_each(|owner| {
        let res: QualityResult;
        let quality_result = match owner_wallet_to_quality.get(owner) {
            Some(q) => q,
            None => {
                res = QualityResult::new(
                    (*owner).clone(),
                    Quality::from(0.0),
                    BidDepth::from(0.0),
                    AskDepth::from(0.0),
                    AlgxBalance::from(0),
                );
                &res
            }
        };
        let QualityResult { ref quality, addr: _, bid_depth, ask_depth, algx_balance } =
            quality_result;

        if quality.val() == 0.0 {
            return;
        }

        if owner_wallet_asset_to_rewards.get(*owner).is_none() {
            owner_wallet_asset_to_rewards.insert((*owner).clone(), HashMap::new());
        }

        let asset_rewards_map = owner_wallet_asset_to_rewards.get_mut(*owner).unwrap();
        if asset_rewards_map.get(asset_id).is_none() {
            asset_rewards_map.insert(*asset_id, OwnerWalletAssetQualityResult::default());
        }
        let owner_entry = asset_rewards_map.get_mut(asset_id).unwrap();
        owner_entry.algx_balance_sum += *algx_balance;
        owner_entry.quality_sum += *quality;
        if total_bid_depth.val() > 0.0 {
            owner_entry.depth += bid_depth.as_depth() / total_bid_depth.as_depth();
            owner_entry.has_bid = true;
        }
        if total_ask_depth.val() > 0.0 {
            owner_entry.depth += ask_depth.as_depth() / total_ask_depth.as_depth();
            owner_entry.has_ask = true;
        }
        if quality.val() >= 0.0000001 {
            match check_mainnet_period(unix_time) {
                MainnetPeriod::Version1 => owner_entry.uptime += Uptime::from(1),
                MainnetPeriod::Version2 => {
                    if owner_entry.has_ask && owner_entry.has_bid {
                        owner_entry.uptime += Uptime::from(1);
                    }
                }
            }
        }
    })
}

/// Update the quality for each wallet for a given asset ID. This is calculated for each minute
pub fn update_owner_wallet_quality_per_asset(
    inputted_asset_id: &u32,
    state_machine: &mut StateMachine,
    initial_state: &InitialState,
) {
    let quality_analytics =
        get_analytics_per_escrow(inputted_asset_id, state_machine, initial_state);

    let StateMachine { ref mut owner_wallet_asset_to_quality_result, ref timestep, .. } =
        state_machine;

    let owner_wallet_to_quality = get_owner_wallet_to_quality(initial_state, &quality_analytics);

    let total_bid_depth =
        quality_analytics.iter().fold(BidDepth::from(0.0), |sum, entry| sum + entry.bid_depth);
    let total_ask_depth =
        quality_analytics.iter().fold(AskDepth::from(0.0), |sum, entry| sum + entry.ask_depth);

    update_owner_wallet_quality(
        owner_wallet_asset_to_quality_result,
        &owner_wallet_to_quality,
        inputted_asset_id,
        timestep,
        &total_bid_depth,
        &total_ask_depth,
    );
}
