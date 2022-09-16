// eslint-disable-next-line require-jsdoc
// @ts-nocheck

module.exports = function(keys, values, rereduce) {
  const getOpen = vals => {
    return vals.reduce((retVal, val) => {
      if (val.unixTime < retVal.unixTime) {
        retVal = val;
      }
      return {unixTime: retVal.unixTime, formattedPrice: retVal.formattedPrice};
    }, vals[0]);
  };
  const getClose = vals => {
    return vals.reduce((retVal, val) => {
      if (val.unixTime > retVal.unixTime) {
        retVal = val;
      }
      return {unixTime: retVal.unixTime, formattedPrice: retVal.formattedPrice};
    }, vals[0]);
  };
  const getHigh = vals => {
    return vals.reduce((retVal, val) => {
      if (val.formattedPrice > retVal.formattedPrice) {
        retVal = val;
      }
      return {unixTime: retVal.unixTime, formattedPrice: retVal.formattedPrice};
    }, vals[0]);
  };
  const getLow = vals => {
    return vals.reduce((retVal, val) => {
      if (val.formattedPrice < retVal.formattedPrice) {
        retVal = val;
      }
      return {unixTime: retVal.unixTime, formattedPrice: retVal.formattedPrice};
    }, vals[0]);
  };

  if (!rereduce) {
    return {
      'o': getOpen(values),
      'l': getLow(values),
      'h': getHigh(values),
      'c': getClose(values),
    };
  } else {
    return {
      'o': getOpen(values.map(v => v.o)),
      'l': getLow(values.map(v => v.l)),
      'h': getHigh(values.map(v => v.h)),
      'c': getClose(values.map(v => v.c)),
    };
  }
};
