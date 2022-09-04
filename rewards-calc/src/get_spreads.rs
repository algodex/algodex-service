use serde::Serialize;

use crate::EscrowValue;
use crate::HashMap;

#[derive(Debug, Clone, Serialize)]
pub struct Spread {
    pub ask: Option<f64>,
    pub bid: Option<f64>,
}

impl Spread {
    pub fn new(ask: Option<f64>, bid: Option<f64>) -> Spread {
        Spread { ask, bid }
    }
}

#[derive(Debug)]
enum PriceType {
    Bid(f64),
    Ask(f64),
}

pub fn get_spreads(
    escrow_to_balance: &HashMap<String, u64>,
    escrow_addr_to_data: &HashMap<String, EscrowValue>,
) -> HashMap<u32, Spread> {
    let spreads: HashMap<u32, Spread> = escrow_to_balance
        .keys()
        .filter(|&escrow| *(escrow_to_balance.get(escrow).unwrap()) > 0u64)
        .fold(HashMap::new(), |mut spreads, escrow| {
            let escrow_data = &escrow_addr_to_data.get(escrow).unwrap().data;
            let asset_id = &escrow_data.escrow_info.asset_id;
            let is_algo_buy_escrow = &escrow_data.escrow_info.is_algo_buy_escrow;

            let price = match is_algo_buy_escrow {
                true => PriceType::Bid(escrow_data.escrow_info.price),
                false => PriceType::Ask(escrow_data.escrow_info.price),
            };

            if spreads.get(asset_id).is_none() {
                spreads.insert(*asset_id, Spread::new(None, None));
            }
            let mut spread = spreads.get(asset_id).unwrap().clone();

            if let PriceType::Bid(p) = price {
                if spread.bid.is_none() || spread.bid.unwrap() < p {
                    spread.bid = Some(p);
                    spreads.insert(*asset_id, spread);
                }
            } else if let PriceType::Ask(p) = price {
                if spread.ask.is_none() || spread.ask.unwrap() > p {
                    spread.ask = Some(p);
                    spreads.insert(*asset_id, spread);
                }
            }
            spreads
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
