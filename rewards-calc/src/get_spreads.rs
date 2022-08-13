use crate::HashMap;
use crate::EscrowValue;

#[derive(Debug, Clone)]
pub struct Spread {
  pub ask: Option<f64>,
  pub bid: Option<f64>
}

impl Spread {
  pub fn new(ask: Option<f64>, bid: Option<f64>) -> Spread {
    Spread {
      ask, bid
    }
  }
}

#[derive(Debug)]
enum PriceType {
  Bid(f64),
  Ask(f64)
}

pub fn getSpreads(escrowToBalance: &HashMap<String, u64>, escrowAddrToData: &HashMap<String,EscrowValue>) -> 
  HashMap<u32, Spread> {
    let spreads:HashMap<u32, Spread> = escrowToBalance.keys()
      .filter(|&escrow| *(escrowToBalance.get(escrow).unwrap()) > 0u64)
      .fold(HashMap::new(), |mut spreads, escrow| {
        let escrowData = &escrowAddrToData.get(escrow).unwrap().data;
        let assetId = &escrowData.escrow_info.asset_id;
        let isAlgoBuyEscrow = &escrowData.escrow_info.is_algo_buy_escrow;

        let price = match isAlgoBuyEscrow {
          true => PriceType::Bid(escrowData.escrow_info.price),
          false => PriceType::Ask(escrowData.escrow_info.price)
        };

        if let None = spreads.get(assetId) {
          spreads.insert(*assetId, Spread::new(None, None));
        }
        let mut spread = spreads.get(assetId).unwrap().clone();

        if let PriceType::Bid(p) = price {
          if (spread.bid.is_none() || spread.bid.unwrap() < p) {
            spread.bid = Some(p);
            spreads.insert(*assetId, spread);
          }
        } else if let PriceType::Ask(p) = price {
          if (spread.ask.is_none() || spread.ask.unwrap() > p) {
            spread.ask = Some(p);
            spreads.insert(*assetId, spread);
          }
        }

        return spreads;
      });
    spreads
  }


// const getSpreads = ({escrowToBalance, escrowAddrToData}) => {
//   const spreads = Object.keys(escrowToBalance)
//       .filter(escrow => escrowToBalance[escrow] > 0)
//       .reduce( (spreads, escrow) => {
//         const escrowData = escrowAddrToData[escrow].data;
//         const assetId = escrowData.escrowInfo.assetId;
//         const isAlgoBuyEscrow = escrowData.escrowInfo.isAlgoBuyEscrow;
//         const assetKey = 'asset:'+assetId;
//         if (spreads[assetKey] === undefined) {
//           spreads[assetKey] = {};
//         }
//         const spread = spreads[assetKey];
//         if (isAlgoBuyEscrow &&
//           (spread.bid === undefined ||
//            spread.bid < escrowData.escrowInfo.price)) {
//           spread.bid = escrowData.escrowInfo.price;
//         } else if (!isAlgoBuyEscrow &&
//           (spread.ask === undefined ||
//            spread.ask > escrowData.escrowInfo.price)) {
//           spread.ask = escrowData.escrowInfo.price;
//         }
//         return spreads;
//       }, {});
//   return spreads;
// };

// module.exports = getSpreads;