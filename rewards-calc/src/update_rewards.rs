use crate::StateMachine;
use crate::InitialState;
use crate::getSpreads;
use core::panic;
use std::collections::HashMap;
use crate::structs::{EscrowValue};
use std::ops::{Add,Sub,Div,Mul,AddAssign};
use crate::quality_type::{*};

#[derive(Debug)]
pub struct QualityResult {
  addr: String,
  quality: Quality,
  bidDepth: BidDepth,
  askDepth: AskDepth,
  algxBalance: AlgxBalance
}

#[derive(Debug)]
pub struct OwnerRewardsResult {
  pub algxBalanceSum: AlgxBalance,
  pub qualitySum: Quality,
  pub uptime: Uptime,
  pub depth: Depth,
  pub has_bid: bool,
  pub has_ask: bool
}

#[derive(Debug)]
pub struct OwnerFinalRewardsResult {
  pub ownerWallet: String,
  pub algxBalanceSum: AlgxBalance,
  pub qualitySum: Quality,
  pub qualityFinal: Quality,
  pub uptime: Uptime,
  pub depthSum: Depth
}

impl Default for OwnerFinalRewardsResult {
  fn default() -> Self {
      Self {
        ownerWallet: String::from("NOWALLET"),
        algxBalanceSum: AlgxBalance::from(0), 
        qualitySum: Quality::from(0.0),
        qualityFinal: Quality::from(0.0),
        uptime: Uptime::from(0),
        depthSum: Depth::from(0.0)
      }
  }
}

impl Default for OwnerRewardsResult {
  fn default() -> Self {
      Self { 
        algxBalanceSum: AlgxBalance::from(0), 
        qualitySum: Quality::from(0.0),
        uptime: Uptime::from(0),
        depth: Depth::from(0.0),
        has_bid: false,
        has_ask: false
      }
  }
}
impl QualityResult {
  pub fn new(addr: String, quality: Quality, bidDepth: BidDepth, askDepth: AskDepth, algxBalance: AlgxBalance) -> QualityResult {
    QualityResult {
      addr, quality, bidDepth, askDepth, algxBalance
    }
  }
}

// impl OwnerRewardsResult {
//   pub fn new(algxBalanceSum: AlgxBalance, qualitySum: Quality,
//     uptime: Uptime, depth: Depth) -> OwnerRewardsResult {
//     OwnerRewardsResult {
//       algxBalanceSum, qualitySum, uptime, depth, has_both_spread_sides: false
//     }
//   }
// }



enum OrderType {
  Bid,
  Ask
}

use OrderType::Bid as Bid;
use OrderType::Ask as Ask;

enum MainnetPeriod {
  Version1,
  Version2
}

/// Get the current mainnet period. Either 1 or 2 based on the timestamp.
fn check_mainnet_period(unix_time: &u32) -> MainnetPeriod {
  // Thu Jun 02 2022 23:59:59 GMT-0400 (Eastern Daylight Time)
  if (*unix_time < 1654228799) {
    return MainnetPeriod::Version1;
  } else {
    return MainnetPeriod::Version2;
  }
}

/// https://docs.algodex.com/rewards-program/algx-liquidity-rewards-program#initial-maximum-spreads
fn get_spread_multiplier(unix_time: &u32, percent_distant: &f64) -> f64 {
  let mainnet_period = check_mainnet_period(unix_time);
  if let MainnetPeriod::Version1 = mainnet_period {
    return 1.0;
  }
  let adj_percent = *percent_distant * 100.0;
  if (adj_percent < 0.5) {
    return 10.0;
  } else if (adj_percent < 1.0) {
    return 2.5;
  }

  return 1.0;
}

/// Check if eligible for ALGX rewards
/// https://docs.algodex.com/rewards-program/algx-liquidity-rewards-program
fn check_is_eligible(percentDistant: &f64, orderType: &OrderType,
  depth: &f64, ownerAlgxBalance: &AlgxBalance, unix_time: &u32) -> bool {

  match check_mainnet_period(unix_time) {
    MainnetPeriod::Version1 => {
      if (*percentDistant > 0.1) { // 10%
        return false
      }
      if (*depth < 15.0 && matches!(orderType, Bid)) { //FIXME 
        return false
      }
      if (*depth < 30.0 && matches!(orderType, Ask)) {
        return false;
      }
      return true;
    },
    MainnetPeriod::Version2 => {
      if (ownerAlgxBalance.val() < 3000 * 10u64.pow(6)) { // FIXME change to 3000 
        return false;
      }
      if (*percentDistant > 0.05) { // 5%
        return false;
      }
      if (*depth < 50.0 && matches!(orderType, Bid)) { //FIXME 
        return false;
      }
      if (*depth < 100.0 && matches!(orderType, Ask)) {
        return false;
      }
      return true;
    }
  };
}


pub fn updateRewards(
  inputtedAssetId: &u32, stateMachine: &mut StateMachine, initialState: &InitialState) {
  let StateMachine { ref escrowToBalance, ref spreads, ref ownerWalletToALGXBalance,
    ref mut ownerWalletAssetToRewards, ref algoPrice, ref timestep, .. } = stateMachine;
  let InitialState { ref escrowAddrToData, ref assetIdToEscrows, .. } = initialState;
  let qualityAnalytics: Vec<QualityResult> = assetIdToEscrows.get(inputtedAssetId).unwrap().iter()
    //.map(|escrow| escrow.clone())
    .filter(|escrow| escrowToBalance.get(*escrow).unwrap() > &0u64)
    .filter(|escrow| {
      let assetId = &escrowAddrToData.get(*escrow).unwrap().data.escrow_info.asset_id;
      let spread = spreads.get(assetId);
      if (spread.is_none() || spread.unwrap().ask.is_none() || spread.unwrap().bid.is_none()) {
        return false;
      }
      return true;
    })
    .map(|escrow| {
      let assetId = &escrowAddrToData.get(escrow).unwrap().data.escrow_info.asset_id;
      let price = &escrowAddrToData.get(escrow).unwrap().data.escrow_info.price;
      let decimals = &escrowAddrToData.get(escrow).unwrap().data.asset_decimals;
      let balance = escrowToBalance.get(escrow).unwrap();
      let ownerAddr = &escrowAddrToData.get(escrow).unwrap().data.escrow_info.owner_addr;
      let ownerAlgxBalance = AlgxBalance::from(*ownerWalletToALGXBalance.get(ownerAddr).unwrap_or(&0u64));
      let spread = spreads.get(assetId);
      if (spread.is_none() || spread.unwrap().ask.is_none() || spread.unwrap().bid.is_none()) {
        dbg!("{spread} {assetId}");
        panic!("Invalid spread!");
      }
      let ask = spread.unwrap().ask.unwrap();
      let bid = spread.unwrap().bid.unwrap();

      let midMarket = (ask + bid) / 2.0;
      let distanceFromSpread = (price - midMarket).abs();
      let percentDistant = distanceFromSpread / midMarket;
      let depth =
        (*algoPrice) * (*balance as f64) * price / (10_i64.pow(*decimals as u32) as f64);
      let orderType = match escrowAddrToData.get(escrow).unwrap().data.escrow_info.is_algo_buy_escrow {
        true => Bid,
        false => Ask
      };

      let isEligible = check_is_eligible(&percentDistant, &orderType, &depth, &ownerAlgxBalance, timestep);
      let spread_multiplier = get_spread_multiplier(timestep, &percentDistant);
      let quality = match isEligible {
        true => spread_multiplier * depth / (percentDistant + 0.0001),
        false => 0.0
      };
      let bidDepth = match orderType {
        Bid => depth,
        _ => 0f64
      };
      let askDepth = match orderType {
        Ask => depth,
        _ => 0f64
      };
      return QualityResult {addr: escrow.clone(), quality: Quality::from(quality),
        bidDepth: BidDepth::from(bidDepth), askDepth: AskDepth::from(askDepth),
        algxBalance: ownerAlgxBalance};
    })
    .collect();

  let ownerWalletToQuality: HashMap<&String, QualityResult> = qualityAnalytics.iter()
    .filter(|entry| entry.quality.val() > 0.0)
    .fold(HashMap::new(), |mut ownerWalletToQuality, entry| {
      
      let ownerAddr = &escrowAddrToData.get(&entry.addr).unwrap().data.escrow_info.owner_addr;

      let qualityDataOpt = ownerWalletToQuality.get(ownerAddr);
      if let None = qualityDataOpt {
        ownerWalletToQuality.insert(ownerAddr, 
          QualityResult { addr: ownerAddr.clone(), quality: Quality::from(0.0),
            bidDepth: BidDepth::from(0.0), askDepth: AskDepth::from(0.0),
            algxBalance: AlgxBalance::from(0) });
      }

      let qualityEntry = ownerWalletToQuality.get_mut(ownerAddr).unwrap();
      qualityEntry.quality += entry.quality;
      qualityEntry.bidDepth += entry.bidDepth;
      qualityEntry.askDepth += entry.askDepth;
      qualityEntry.algxBalance += entry.algxBalance;
      ownerWalletToQuality
    });

    let totalBidDepth = qualityAnalytics.iter().fold(BidDepth::from(0.0),
      |sum, entry| sum + entry.bidDepth);
    let totalAskDepth = qualityAnalytics.iter().fold(AskDepth::from(0.0),
      |sum, entry| sum + entry.askDepth);
  
    ownerWalletToQuality.keys()
    .map(|owner| *owner)
    .for_each(|owner| {
      let res: QualityResult;
      let qualityResult = match ownerWalletToQuality.get(owner) {
        Some(q) => q,
        None => {
          res = QualityResult::new(owner.clone(), Quality::from(0.0),
            BidDepth::from(0.0), AskDepth::from(0.0), AlgxBalance::from(0));
          &res
        }
      };
      let QualityResult { ref quality, ref addr, ref bidDepth,
        ref askDepth, ref algxBalance } = qualityResult;
      
      if (quality.val() == 0.0) {
        return;
      }

      if ownerWalletAssetToRewards.get(owner).is_none() {
        ownerWalletAssetToRewards.insert(owner.clone(), HashMap::new());
      }

      let assetRewardsMap = ownerWalletAssetToRewards.get_mut(owner).unwrap();
      if (assetRewardsMap.get(inputtedAssetId).is_none()) {
        assetRewardsMap.insert(*inputtedAssetId, OwnerRewardsResult::default());
      }
      let owner_entry = assetRewardsMap.get_mut(inputtedAssetId).unwrap();
      owner_entry.algxBalanceSum += *algxBalance;
      owner_entry.qualitySum += *quality;
      if (totalBidDepth.val() > 0.0) {
        owner_entry.depth += bidDepth.asDepth() / totalBidDepth.asDepth();
        owner_entry.has_bid = true;
      }
      if (totalAskDepth.val() > 0.0) {
        owner_entry.depth += askDepth.asDepth() / totalAskDepth.asDepth();
        owner_entry.has_ask = true;
      } 
      if (quality.val() >= 0.0000001) {
        match check_mainnet_period(timestep) {
          MainnetPeriod::Version1 => owner_entry.uptime += Uptime::from(1),
          MainnetPeriod::Version2 => {
            if (owner_entry.has_ask && owner_entry.has_bid) {
              owner_entry.uptime += Uptime::from(1);
            }
          }
        }
      }
    })
}
