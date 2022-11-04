module.exports = function(keys, values, rereduce) {
  return values.reduce((mostRecentValue, value) => {
    if (value.round > mostRecentValue.round) {
      return value;
    }
    // Same round, but txn comes later. Possible if multiple executions for same escrow
    if (value.txnCount > mostRecentValue.txnCount) {
      return value;
    }
    return mostRecentValue;
  }, values[0]);
};
