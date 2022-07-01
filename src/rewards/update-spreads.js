
const getSpreads = require('./get-spreads');

const updateSpreads = (stateMachine, {escrowAddrToData}) => {
  const escrowToBalance = stateMachine.escrowToBalance;
  const newSpreads = getSpreads({escrowToBalance, escrowAddrToData});
  stateMachine.spreads = newSpreads;
};

module.exports = updateSpreads;
