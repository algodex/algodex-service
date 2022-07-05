
const getInitialBalances = (unixTime, escrows) => {
  return escrows.reduce( (escrowToBalance, escrow) => {
    const addr = escrow._id;
    const history = escrow.data.history;
    let balance = 0;
    for (let i = 0; i < history.length; i++) {
      if (history[i].time <= unixTime) {
        balance = history[i].algoAmount || history[i].asaAmount;
      } else {
        break;
      }
    }
    escrowToBalance[addr] = balance;
    return escrowToBalance;
  }, {});
};

module.exports = getInitialBalances;
