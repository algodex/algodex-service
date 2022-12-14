// IMPORTANT!! This needs to be orderOptinStatus/orderOptinStatus
// not blocks/orderOptinStatus

module.exports = function(keys, values, rereduce) {
  return values.reduce((mostRecentValue, value) => {
    if (value.round > mostRecentValue.round) {
      return value;
    } else if (mostRecentValue.round > value.round) {
      return mostRecentValue;
    } else if (value.txnCount > mostRecentValue.txnCount) {
      // Same round, but txn comes later. Possible if multiple executions for same escrow
      return value;
    }

    return mostRecentValue;
  }, values[0]);
};
