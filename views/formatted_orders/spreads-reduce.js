/* eslint-disable max-len */
module.exports = function(keys, values, rereduce) {
  if (rereduce) {
    return values.reduce((finalVal, val) => {
      if (val.highestBid.maxPrice > finalVal.highestBid.maxPrice) {
        finalVal.highestBid.maxPrice = val.highestBid.maxPrice;
      }
      if (val.lowestAsk.minPrice < finalVal.lowestAsk.minPrice) {
        finalVal.lowestAsk.minPrice = val.lowestAsk.minPrice;
      }
      return finalVal;
    }, values[0]);
  } else {
    const highestBid = values.reduce((max, val) => {
      if (val.formattedPrice && val.isAlgoBuyEscrow && val.formattedPrice > max.maxPrice) {
        max.maxPrice = val.formattedPrice;
      }
      return max;
    }, {maxPrice: 0, isAlgoBuyEscrow: true});
    const lowestAsk = values.reduce((min, val) => {
      if (val.formattedPrice && !val.isAlgoBuyEscrow && val.formattedPrice < min.minPrice) {
        min.minPrice = val.formattedPrice;
      }
      return min;
    }, {minPrice: 1E30, isAlgoBuyEscrow: false});

    return {highestBid, lowestAsk};
  }
};
