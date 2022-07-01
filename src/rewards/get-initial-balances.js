
const getInitialBalances = (unixTime, escrows) => {
  return escrows.reduce( (escrowToBalance, escrow) => {
    const history = escrow.data.history;
    let balance = 0;
    for (let i = 0; i < history.length; i++) {
      if (history[i].time <= unixTime) {
        balance = escrow.algoAmount || escrow.asaAmount;
      } else {
        break;
      }
    }
    escrowToBalance[escrow] = balance;
  }, {});
};

module.exports = getInitialBalances;
