
const updateRewards = ({ownerWalletToRewards, spreads,
  escrowToBalance, escrowAddrToData}) => {
  
  const escrowAnalytics =
    Object.keys(escrowToBalance).filter((escrow) => escrowToBalance[escrow] > 0)
        .filter((escrow) => {
          const assetId = escrowAddrToData[escrow].data.escrowInfo.assetId;
          const spread = spreads[`asset:${assetId}`];
          if (!spread || !spread.ask || !spread.bid) {
            return false;
          }
          return true;
        }).map((escrow) => {
          const exchangeRate = 1; //1 algo to USD. FIXME
          const assetId = escrowAddrToData[escrow].data.escrowInfo.assetId;
          const price = escrowAddrToData[escrow].data.escrowInfo.price;
          const decimals = escrowAddrToData[escrow].data.assetDecimals;
          // const isBid =escrowAddrToData[escrow].data.escrowInfo.isAlgoBuyEscrow;
          const balance = escrowToBalance[escrow];
          const spread = spreads[`asset:${assetId}`];
          if (!spread.ask || !spread.bid) {
            return {escrow, invalid: 'no spread'};
          }
          const midMarket = (spread.ask + spread.bid) / 2;
          const distanceFromSpread = Math.abs(price - midMarket);
          const percentDistant = distanceFromSpread / midMarket;
          const depth = exchangeRate * balance * price / (10**decimals);
          const quality = depth / (percentDistant + 0.0001);
          const orderType = escrowAddrToData[escrow].data.isAlgoBuyEscrow ?
              'bid' : 'ask';
          return {spread, price, balance, midMarket, distanceFromSpread,
            percentDistant, depth, quality, decimals, assetId, exchangeRate,
            orderType};
        });
  console.log(escrowAnalytics);
};

module.exports = updateRewards;
