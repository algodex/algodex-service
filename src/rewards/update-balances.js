
const updateBalances = ({changedEscrows, changeTime, escrowToBalance,
  escrowTimeToBalance}) => {
  changedEscrows.forEach((escrow) => {
    const balance = escrowTimeToBalance[`${escrow}:${changeTime}`];
    escrowToBalance[escrow] = balance;
  });
};

module.exports = updateBalances;