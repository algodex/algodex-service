// eslint-disable-next-line require-jsdoc
// @ts-nocheck

module.exports = function(keys, values, rereduce) {
  const getOpen = vals => {
    return vals.reduce((retVal, val) => {
      if (val.unixTime < retVal.unixTime) {
        retVal = val;
      }
      return retVal;
    }, vals[0]);
  };
  const getClose = vals => {
    return vals.reduce((retVal, val) => {
      if (val.unixTime > retVal.unixTime) {
        retVal = val;
      }
      return retVal;
    }, vals[0]);
  };
  const getHigh = vals => {
    return vals.reduce((retVal, val) => {
      if (val.formattedPrice > retVal.formattedPrice) {
        retVal = val;
      }
      return retVal;
    }, vals[0]);
  };
  const getLow = vals => {
    return vals.reduce((retVal, val) => {
      if (val.formattedPrice < retVal.formattedPrice) {
        retVal = val;
      }
      return retVal;
    }, vals[0]);
  };

  return {
    'o': getOpen(values),
    'l': getLow(values),
    'h': getHigh(values),
    'c': getClose(values),
  };
};
