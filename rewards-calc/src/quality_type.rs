/*pub enum QualityType<T> {
  BidDepth(T),
  AskDepth(T),
  Depth(T),
  Quality(T),
  Price(T),
  Uptime(T), //u64
  AlgxBalance(T), //u64
}*/

use duplicate::duplicate_item;
use serde::{Deserialize, Serialize};

use std::ops::{Add, AddAssign, Div, Mul, Sub};

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct BidDepth {
    val: f64,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct AskDepth {
    val: f64,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Depth {
    val: f64,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Quality {
    val: f64,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Price {
    val: f64,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Uptime {
    val: u64,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AlgxBalance {
    val: u64,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct EarnedAlgx {
    val: f64,
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [EarnedAlgx])]
impl name {
    pub fn from(val: f64) -> Self {
        Self { val }
    }
    pub fn val(&self) -> f64 {
        self.val
    }
}

#[duplicate_item(name; [Uptime]; [AlgxBalance])]
impl name {
    pub fn from(val: u64) -> Self {
        Self { val }
    }
    pub fn val(&self) -> u64 {
        self.val
    }
}

#[duplicate_item(name; [BidDepth]; [AskDepth])]
impl name {
    pub fn as_depth(&self) -> Depth {
        Depth { val: self.val }
    }
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Price];
  [Quality]; [Depth]; [EarnedAlgx])]
impl PartialEq for name {
    fn eq(&self, other: &Self) -> bool {
        let res = ulps_eq!(self.val, other.val, max_ulps = 15);
        if !res {
            println!("not partial eq! {} {}", self.val, other.val);
        }
        res
    }
}
#[duplicate_item(name; [BidDepth]; [AskDepth]; [Price];
  [Quality]; [Depth];)]
impl Eq for name {}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [Uptime]; [AlgxBalance])]
impl Add for name {
    type Output = Self;

    fn add(self, _rhs: Self) -> Self {
        let res = self.val + _rhs.val;
        Self { val: res }
    }
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [Uptime]; [AlgxBalance])]
impl AddAssign for name {
    fn add_assign(&mut self, _rhs: Self) {
        let res = self.val + _rhs.val;
        self.val = res;
    }
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [Uptime]; [AlgxBalance])]
impl Sub for name {
    type Output = Self;

    fn sub(self, _rhs: Self) -> Self {
        let res = self.val - _rhs.val;
        Self { val: res }
    }
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [Uptime]; [AlgxBalance])]
impl Mul for name {
    type Output = Self;

    fn mul(self, _rhs: Self) -> Self {
        let res = self.val * _rhs.val;
        Self { val: res }
    }
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [Uptime]; [AlgxBalance])]
impl Div for name {
    type Output = Self;

    fn div(self, _rhs: Self) -> Self {
        let res = self.val / _rhs.val;
        Self { val: res }
    }
}
