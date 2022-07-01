const getOwnerBalanceAtTime = (ownerBalanceToHist, ownerAddr, unixTime) => {
  const history = ownerBalanceToHist[ownerAddr];

  let balance = 0;
  for (let i = 0; i < history.length; i++) {
    if (history[i].time <= unixTime) {
      balance = escrow.algxBalance;
    } else {
      break;
    }
  }
  return balance;
};

module.exports = getOwnerBalanceAtTime;
