use crate::StateMachine;
use crate::InitialState;
use crate::getSpreads;
use std::collections::HashMap;
use crate::structs::{EscrowValue};

#[derive(Debug)]
pub struct QualityResult {
  addr: String,
  quality: f64,
  bidDepth: f64,
  askDepth: f64
}

#[derive(Debug, Default)]
pub struct OwnerRewardsResult {
  algxBalanceSum: u64,
  qualitySum: f64,
  uptime: u64,
  depth: f64
}

impl QualityResult {
  pub fn new(addr: String, quality: f64, bidDepth: f64, askDepth: f64) -> QualityResult {
    QualityResult {
      addr, quality, bidDepth, askDepth
    }
  }
}

impl OwnerRewardsResult {
  pub fn new(algxBalanceSum: u64, qualitySum: f64, uptime: u64, depth: f64) -> OwnerRewardsResult {
    OwnerRewardsResult {
      algxBalanceSum, qualitySum, uptime, depth
    }
  }
}



enum OrderType {
  Bid,
  Ask
}

use OrderType::Bid as Bid;
use OrderType::Ask as Ask;

pub fn updateRewards(inputtedAssetId: &u32, stateMachine: &mut StateMachine, initialState: &InitialState) {
  let StateMachine { ref escrowToBalance, ref spreads, ref mut ownerWalletAssetToRewards, .. } = stateMachine;
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
      let exchangeRate = 1; //FIXME
      let assetId = &escrowAddrToData.get(escrow).unwrap().data.escrow_info.asset_id;
      let price = &escrowAddrToData.get(escrow).unwrap().data.escrow_info.price;
      let decimals = &escrowAddrToData.get(escrow).unwrap().data.asset_decimals;
      let balance = escrowToBalance.get(escrow).unwrap();
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
      let depth = (exchangeRate as f64) * (*balance as f64) * price / (10_i64.pow(*decimals as u32) as f64);
      let orderType = match escrowAddrToData.get(escrow).unwrap().data.escrow_info.is_algo_buy_escrow {
        true => Bid,
        false => Ask
      };

      let isEligibleFn = |percentDistant: &f64, orderType: &OrderType, depth: &f64| -> bool {
        if (*percentDistant > 0.1) {
          return false;
        }
        if (*depth < 15.0 && matches!(orderType, Bid)) {
          return false;
        }
        if (*depth < 30.0 && matches!(orderType, Ask)) {
          return false;
        }
        return true;
      };
      let isEligible = isEligibleFn(&percentDistant, &orderType, &depth);

      let quality = match isEligible {
        true => depth / (percentDistant + 0.0001),
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
      return QualityResult {addr: escrow.clone(), quality, bidDepth, askDepth};
    })
    .collect();

  let ownerWalletToQuality: HashMap<&String, QualityResult> = qualityAnalytics.iter().filter(|entry| entry.quality > 0.0)
    .fold(HashMap::new(), |mut ownerWalletToQuality, entry| {
      
      let ownerAddr = &escrowAddrToData.get(&entry.addr).unwrap().data.escrow_info.owner_addr;

      let qualityDataOpt = ownerWalletToQuality.get(ownerAddr);
      if let None = qualityDataOpt {
        ownerWalletToQuality.insert(ownerAddr, 
          QualityResult { addr: ownerAddr.clone(), quality: 0.0, bidDepth: 0.0, askDepth: 0.0 });
      }

      let qualityEntry = ownerWalletToQuality.get_mut(ownerAddr).unwrap();
      qualityEntry.quality += entry.quality;
      qualityEntry.bidDepth += entry.bidDepth;
      qualityEntry.askDepth += entry.askDepth;
      ownerWalletToQuality
    });

    let totalBidDepth = qualityAnalytics.iter().fold(0.0, |sum, entry| sum + entry.bidDepth);
    let totalAskDepth = qualityAnalytics.iter().fold(0.0, |sum, entry| sum + entry.askDepth);
  
    ownerWalletToQuality.keys()
    .map(|owner| *owner)
    .for_each(|owner| {
      let algxBalance = 0;
      let res: QualityResult;
      let qualityResult = match ownerWalletToQuality.get(owner) {
        Some(q) => q,
        None => {
          res = QualityResult::new(owner.clone(), 0.0,0.0, 0.0);
          &res
        }
      };
      let QualityResult { ref quality, ref addr, ref bidDepth, ref askDepth } = qualityResult;
      
      if ownerWalletAssetToRewards.get(owner).is_none() {
        ownerWalletAssetToRewards.insert(owner.clone(), HashMap::new());
      }

      let assetRewardsMap = ownerWalletAssetToRewards.get_mut(owner).unwrap();
      if (assetRewardsMap.get(inputtedAssetId).is_none()) {
        assetRewardsMap.insert(*inputtedAssetId, OwnerRewardsResult::default());
      }

      let entry = assetRewardsMap.get_mut(inputtedAssetId).unwrap();
      entry.algxBalanceSum += algxBalance;
      entry.qualitySum += quality;
      if (totalBidDepth > 0.0) {
        entry.depth += askDepth / totalBidDepth;
      }
      if (totalAskDepth > 0.0) {
        entry.depth += askDepth / totalAskDepth;
      } 

      if (*quality > 0.0000001) {
        entry.uptime += 1;
      }
    })
}
