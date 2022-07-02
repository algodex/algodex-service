const getSpreads = ({escrowToBalance, escrowAddrToData}) => {
  const spreads = Object.keys(escrowToBalance)
      .filter(escrow => escrowToBalance[escrow] > 0)
      .reduce( (spreads, escrow) => {
        const escrowData = escrowAddrToData[escrow].data;
        const assetId = escrowData.escrowInfo.assetId;
        const isAlgoBuyEscrow = escrowData.escrowInfo.isAlgoBuyEscrow;
        const assetKey = 'asset:'+assetId;
        if (spreads[assetKey] === undefined) {
          spreads[assetKey] = {};
        }
        const spread = spreads[assetKey];
        if (isAlgoBuyEscrow &&
          (spread.bid === undefined ||
           spread.bid < escrowData.escrowInfo.price)) {
          spread.bid = escrowData.escrowInfo.price;
        } else if (!isAlgoBuyEscrow &&
          (spread.ask === undefined ||
           spread.ask > escrowData.escrowInfo.price)) {
          spread.ask = escrowData.escrowInfo.price;
        }
        return spreads;
      }, {});
  return spreads;
};

module.exports = getSpreads;

