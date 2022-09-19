
// @ts-nocheck

module.exports = function(keys, values, rereduce) {
  const calculateLastValue = values => {
    const lastValue = values.reduce( (finalValue, value) => {
      if (value.unixTime > finalValue.unixTime) {
        return value;
      }
      return finalValue;
    }, values[0]);

    return lastValue;
  };

  const calculateYesterdayValue = values => {
    // const today = 1663255814; // for debugging
    const today = Date.now() / 1000;

    values.sort((a, b) => b.unixTime - a.unixTime);
    const yesterdayValue = values.find( value => value.unixTime <= today - 86400);
    return yesterdayValue;
  };

  const calculateDailyChangePct = (lastValue, yesterdayValue) => {
    // return -1;
    if (!yesterdayValue || !lastValue) {
      return 0;
    }
    const res = (lastValue - yesterdayValue) / yesterdayValue * 100;
    return res;
  };


  let result;

  if (rereduce) {
    const lastValues = values.map(value => value.lastValue);
    const yesterdayValues = values.map(value => value.yesterdayValue);
    result = {
      lastValue: calculateLastValue(lastValues),
      yesterdayValue: calculateYesterdayValue(yesterdayValues),
    };
  } else {
    result = {
      lastValue: calculateLastValue(values),
      yesterdayValue: calculateYesterdayValue(values),
    };
  }
  result.dailyChange =
    calculateDailyChangePct(result.lastValue.price, result.yesterdayValue.price);
  return result;
};
