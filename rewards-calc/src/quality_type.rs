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


use std::ops::{Add,Sub,Div,Mul,AddAssign};

#[derive(Debug, Copy, Clone)]
pub struct BidDepth {
  val: f64
}

#[derive(Debug, Copy, Clone)]
pub struct AskDepth {
  val: f64
}

#[derive(Debug, Copy, Clone)]
pub struct Depth {
  val: f64
}

#[derive(Debug, Copy, Clone)]
pub struct Quality {
  val: f64
}

#[derive(Debug, Copy, Clone)]
pub struct Price {
  val: f64
}

#[derive(Debug, Copy, Clone)]
pub struct Uptime {
  val: u64
}

#[derive(Debug, Copy, Clone)]
pub struct AlgxBalance {
  val: u64
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price])]
impl name {
  pub fn from(val: f64) -> Self {
    Self{val: val}
  }
  pub fn val(&self) -> f64 {
    self.val
  }
}
#[duplicate_item(name; [Uptime]; [AlgxBalance])]
impl name {
  pub fn from(val: u64) -> Self {
    Self{val: val}
  }
  pub fn val(&self) -> u64 {
    self.val
  }
}

#[duplicate_item(name; [BidDepth]; [AskDepth])]
impl name {
  pub fn asDepth(&self) -> Depth {
    Depth{val: self.val}
  }
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [Uptime]; [AlgxBalance])]
impl Add for name {
  type Output = Self;

  fn add(self, _rhs: Self) -> Self {
    let res = self.val + _rhs.val;
    return Self{val: res};
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
    return Self{val: res};
  }
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [Uptime]; [AlgxBalance])]
impl Mul for name {
  type Output = Self;

  fn mul(self, _rhs: Self) -> Self {
    let res = self.val * _rhs.val;
    return Self{val: res};
  }
}

#[duplicate_item(name; [BidDepth]; [AskDepth]; [Depth];
  [Quality]; [Price]; [Uptime]; [AlgxBalance])]
impl Div for name {
  type Output = Self;

  fn div(self, _rhs: Self) -> Self {
    let res = self.val / _rhs.val;
    return Self{val: res};
  }
}
