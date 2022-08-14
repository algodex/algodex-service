use crate::StateMachine;
use crate::InitialState;
use crate::getSpreads;
use core::panic;
use std::collections::HashMap;
use crate::structs::{EscrowValue};
use std::ops::{Add,Sub,Div,Mul,AddAssign};

#[derive(Debug, Copy, Clone, PartialEq, PartialOrd)]
pub enum QualityType<T> {
  BidDepth(T),
  AskDepth(T),
  Depth(T),
  Quality(T),
  Price(T),
  Uptime(T),
  AlgxBalance(T),
}
use QualityType::{Quality, Uptime, Depth, Price, AskDepth, BidDepth, AlgxBalance};

#[derive(Debug, Copy, Clone)]
pub struct ProtectedQualityType<T> {
  val: QualityType<T>
}


use ProtectedQualityType as PQT;

impl<T> Add for ProtectedQualityType<T> where T: Copy+Clone+Add<Output = T> {
  type Output = ProtectedQualityType<T>;

  fn add(self, _rhs: ProtectedQualityType<T>) -> ProtectedQualityType<T> {
    let (i, k) = self.getSameTypeValsOrPanic(&_rhs);
    let sum = i + k;
    return self.getValOfSameType(sum);
  }
}
impl<T> AddAssign for ProtectedQualityType<T> where T: Copy+Clone+AddAssign+Add<Output = T> {
  fn add_assign(&mut self, _rhs: ProtectedQualityType<T>) {
    let (i, k) = self.getSameTypeValsOrPanic(&_rhs);
    let sum = i + k;
    self.val = *self.getValOfSameType(sum).getVal();
  }
}
impl<T> Sub for ProtectedQualityType<T> where T: Copy+Clone+Sub<Output = T> {
  type Output = ProtectedQualityType<T>;

  fn sub(self, _rhs: ProtectedQualityType<T>) -> ProtectedQualityType<T> {
    let (i, k) = self.getSameTypeValsOrPanic(&_rhs);
    let sum = i - k;
    return self.getValOfSameType(sum);
  }
}
impl<T> Div for ProtectedQualityType<T> where T: Copy+Clone+Div<Output = T> {
  type Output = ProtectedQualityType<T>;

  fn div(self, _rhs: ProtectedQualityType<T>) -> ProtectedQualityType<T> {
    let (i, k) = self.getSameTypeValsOrPanic(&_rhs);
    let sum = i / k;
    return self.getValOfSameType(sum);
  }
}
impl<T> Mul for ProtectedQualityType<T> where T: Copy+Clone+Mul<Output = T> {
  type Output = ProtectedQualityType<T>;

  fn mul(self, _rhs: ProtectedQualityType<T>) -> ProtectedQualityType<T> {
    let (i, k) = self.getSameTypeValsOrPanic(&_rhs);
    let sum = i * k;
    return self.getValOfSameType(sum);
  }
}


impl<T> ProtectedQualityType<T> where T: Copy {
  pub fn asDepth(&self) -> ProtectedQualityType<T> {
    let depth = match(self.val) {
      Depth(innerVal) => Depth(innerVal),
      BidDepth(innerVal) => Depth(innerVal),
      AskDepth(innerVal) => Depth(innerVal),
      _ => panic!("Incorrect type conversion for asDepth")
    };
    return ProtectedQualityType::from(depth);
  }
  pub fn getBidDepth(&self) -> T {
    if let BidDepth(a) = self.getVal() {*a} else { panic!("Incorrect Type") }
  }
  pub fn getAskDepth(&self) -> T {
    if let AskDepth(a) = self.getVal() {*a} else { panic!("Incorrect Type") }
  }
  pub fn getDepth(&self) -> T {
    if let Depth(a) = self.getVal() {*a} else { panic!("Incorrect Type") }
  }
  pub fn getQuality(&self) -> T {
    if let Quality(a) = self.getVal() {*a} else { panic!("Incorrect Type") }
  }
  pub fn getPrice(&self) -> T {
    if let Price(a) = self.getVal() {*a} else { panic!("Incorrect Type") }
  }
  pub fn getUptime(&self) -> T {
    if let Uptime(a) = self.getVal() {*a} else { panic!("Incorrect Type") }
  }
  pub fn getAlgx(&self) -> T {
    if let AlgxBalance(a) = self.getVal() {*a} else { panic!("Incorrect Type") }
  }
  pub fn getVal(&self) -> &QualityType<T> {
    return &self.val;
  }
  pub fn from(val: QualityType<T>) -> ProtectedQualityType<T> {
    return ProtectedQualityType{val};
  }
  fn getSameTypeValsOrPanic(&self, b: &ProtectedQualityType<T>) -> (T, T)
  where T: Clone {
    use QualityType::*;
    match (&self.val, &b.val) {
      (BidDepth(i), BidDepth(k)) => return (i.clone(), k.clone()),
      (AskDepth(i), AskDepth(k)) => return (i.clone(), k.clone()),
      (Depth(i), Depth(k)) => return (i.clone(), k.clone()),
      (Quality(i), Quality(k)) => return (i.clone(), k.clone()),
      (Price(i), Price(k)) => return (i.clone(), k.clone()),
      (Uptime(i), Uptime(k)) => return (i.clone(), k.clone()),
      (AlgxBalance(i), AlgxBalance(k)) => return (i.clone(), k.clone()),
      _ => panic!("Trying to perform operations on different types!")
    };
  }
  fn getValOfSameType(&self, finalVal: T) -> ProtectedQualityType<T> {
    use QualityType::*;
    let qualityVal = match (self.val) {
      (BidDepth(_)) => BidDepth(finalVal),
      (AskDepth(_)) => AskDepth(finalVal),
      (Depth(_)) => Depth(finalVal),
      (Quality(_)) => Quality(finalVal),
      (Price(_)) => Price(finalVal),
      (Uptime(_)) => Uptime(finalVal),
      (AlgxBalance(_)) => AlgxBalance(finalVal),
      _ => panic!("Trying to perform operations on different types!")
    };
    return ProtectedQualityType{val: qualityVal};
  }
}

 
#[derive(Debug)]
pub struct QualityResult {
  addr: String,
  quality: PQT<f64>,
  bidDepth: PQT<f64>,
  askDepth: PQT<f64>
}

#[derive(Debug)]
pub struct OwnerRewardsResult {
  pub algxBalanceSum: PQT<u64>,
  pub qualitySum: PQT<f64>,
  pub uptime: PQT<u64>,
  pub depth: PQT<f64>
}

#[derive(Debug)]
pub struct OwnerFinalRewardsResult {
  pub ownerWallet: String,
  pub algxBalanceSum: PQT<u64>,
  pub qualitySum: PQT<f64>,
  pub qualityFinal: PQT<f64>,
  pub uptime: PQT<u64>,
  pub depthSum: PQT<f64>
}

impl Default for OwnerFinalRewardsResult {
  fn default() -> Self {
      Self {
        ownerWallet: String::from("NOWALLET"),
        algxBalanceSum: PQT::from(AlgxBalance(0)), 
        qualitySum: PQT::from(Quality(0.0)),
        qualityFinal: PQT::from(Quality(0.0)),
        uptime: PQT::from(Uptime(0)),
        depthSum: PQT::from(Depth(0.0))
      }
  }
}

impl Default for OwnerRewardsResult {
  fn default() -> Self {
      Self { 
        algxBalanceSum: PQT::from(AlgxBalance(0)), 
        qualitySum: PQT::from(Quality(0.0)),
        uptime: PQT::from(Uptime(0)),
        depth: PQT::from(Depth(0.0))
      }
  }
}
impl QualityResult {
  pub fn new(addr: String, quality: PQT<f64>, bidDepth: PQT<f64>, askDepth: PQT<f64>) -> QualityResult {
    QualityResult {
      addr, quality, bidDepth, askDepth
    }
  }
}

impl OwnerRewardsResult {
  pub fn new(algxBalanceSum: PQT<u64>, qualitySum: PQT<f64>, uptime: PQT<u64>, depth: PQT<f64>) -> OwnerRewardsResult {
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
      let depth =
        (exchangeRate as f64) * (*balance as f64) * price / (10_i64.pow(*decimals as u32) as f64);
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
      return QualityResult {addr: escrow.clone(), quality: PQT::from(Quality(quality)),
        bidDepth: PQT::from(BidDepth(bidDepth)), askDepth: PQT::from(AskDepth(askDepth))};
    })
    .collect();

  let ownerWalletToQuality: HashMap<&String, QualityResult> = qualityAnalytics.iter()
    .filter(|entry| *entry.quality.getVal() > Quality(0.0))
    .fold(HashMap::new(), |mut ownerWalletToQuality, entry| {
      
      let ownerAddr = &escrowAddrToData.get(&entry.addr).unwrap().data.escrow_info.owner_addr;

      let qualityDataOpt = ownerWalletToQuality.get(ownerAddr);
      if let None = qualityDataOpt {
        ownerWalletToQuality.insert(ownerAddr, 
          QualityResult { addr: ownerAddr.clone(), quality: PQT::from(Quality(0.0)),
            bidDepth: PQT::from(BidDepth(0.0)), askDepth: PQT::from(AskDepth(0.0)) });
      }

      let qualityEntry = ownerWalletToQuality.get_mut(ownerAddr).unwrap();
      qualityEntry.quality += entry.quality;
      qualityEntry.bidDepth += entry.bidDepth;
      qualityEntry.askDepth += entry.askDepth;
      ownerWalletToQuality
    });

    let totalBidDepth = qualityAnalytics.iter().fold(PQT::from(BidDepth(0.0)),
      |sum, entry| sum + entry.bidDepth);
    let totalAskDepth = qualityAnalytics.iter().fold(PQT::from(AskDepth(0.0)),
      |sum, entry| sum + entry.askDepth);
  
    ownerWalletToQuality.keys()
    .map(|owner| *owner)
    .for_each(|owner| {
      let algxBalance = PQT::from(AlgxBalance(0));
      let res: QualityResult;
      let qualityResult = match ownerWalletToQuality.get(owner) {
        Some(q) => q,
        None => {
          res = QualityResult::new(owner.clone(), PQT::from(Quality(0.0)),
            PQT::from(BidDepth(0.0)), PQT::from(AskDepth(0.0)));
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
      entry.qualitySum += *quality;
      if (*totalBidDepth.getVal() > BidDepth(0.0)) {
        entry.depth += bidDepth.asDepth() / totalBidDepth.asDepth();
      }
      if (*totalAskDepth.getVal() > AskDepth(0.0)) {
        entry.depth += askDepth.asDepth() / totalAskDepth.asDepth();
      } 

      if (*quality.getVal() > Quality(0.0000001)) {
        entry.uptime += PQT::from(Uptime(1));
      }
    })
}
