
const updateRewards = ({ownerWalletAssetToRewards, ownerWalletToALGXBalance,
  spreads, escrowToBalance, escrowAddrToData, assetId}) => {
  const inputtedAssetId = assetId;
  const qualityAnalytics =
    Object.keys(escrowToBalance).filter(escrow => escrowToBalance[escrow] > 0)
        .filter(escrow => {
          const assetId = escrowAddrToData[escrow].data.escrowInfo.assetId;
          const spread = spreads[`asset:${assetId}`];
          if (!spread || !spread.ask || !spread.bid) {
            return false;
          }
          if (assetId !== inputtedAssetId) {
            return false;
          }
          return true;
        }).map(escrow => {
          const exchangeRate = 1; // 1 algo to USD. FIXME
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
          const orderType = escrowAddrToData[escrow].data.isAlgoBuyEscrow ?
          'bid' : 'ask';

          let isEligible = true;
          if (percentDistant > 0.1) {
            isEligible = false;
          }
          if (depth < 15 && orderType === 'bid') {
            isEligible = false;
          } else if (depth < 30 && orderType === 'ask') {
            isEligible = false;
          }
          const quality = isEligible ? depth / (percentDistant + 0.0001) : 0;
          return {addr: escrow, quality};
          // return {spread, price, balance, midMarket, distanceFromSpread,
          //   percentDistant, depth, quality, decimals, assetId, exchangeRate,
          //   orderType, isEligible, addr: escrow};
        });
  const ownerWalletToQuality =
  qualityAnalytics.filter(entry => entry.quality && entry.quality > 0)
      .reduce((ownerWalletToQuality, entry) => {
        const ownerAddr =
          escrowAddrToData[entry.addr].data.escrowInfo.ownerAddr;
        if (ownerWalletToQuality[ownerAddr] === undefined) {
          ownerWalletToQuality[ownerAddr] = 0;
        }
        ownerWalletToQuality[ownerAddr] += entry.quality;
        return ownerWalletToQuality;
      }, {});

  // const allOwners = new Set([...Object.keys(ownerWalletToQuality),
  //   ...Object.keys(ownerWalletToALGXBalance)]);

  Object.keys(ownerWalletToQuality).forEach(owner => {
    const algxBalance = (ownerWalletToALGXBalance[owner] / (10**6)) || 0;
    const quality = ownerWalletToQuality[owner] || 0;
    if (ownerWalletAssetToRewards[owner] === undefined) {
      ownerWalletAssetToRewards[owner] = {};
    }
    if (ownerWalletAssetToRewards[owner][inputtedAssetId] === undefined) {
      ownerWalletAssetToRewards[owner][inputtedAssetId] = {algxBalanceSum: 0,
        qualitySum: 0, uptime: 0};
    }
    const entry = ownerWalletAssetToRewards[owner][inputtedAssetId];
    entry.algxBalanceSum += algxBalance;
    entry.qualitySum += quality;
    if (ownerWalletToQuality[owner] !== undefined &&
      ownerWalletToQuality[owner] > 0.0000001) {
      entry.uptime++;
    }
  });
};

module.exports = updateRewards;
