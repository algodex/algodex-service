const calculateLastValue = (values) => {
  const lastValue = values.reduce( (finalValue, value) => {
    if (value.unixTime > finalValue.unixTime) {
      return value;
    }
    return finalValue;
  }, values[0]);

  return lastValue;
};

const calculateYesterdayValue = (values) => {
  const today = Date.now() / 1000;
  const yesterdayValue = values.reduce( (finalValue, value) => {
    if ( (finalValue.unixTime === undefined ||
        value.unixTime > finalValue.unixTime) &&
        value.unixTime <= today - 86400) {
      return value;
    }
    return finalValue;
  }, {});
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

module.exports = function(keys, values, rereduce) {
  let result;

  if (rereduce) {
    const lastValues = values.map((value) => value.lastValue);
    const yesterdayValues = values.map((value) => value.yesterdayValue);
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
    calculateDailyChangePct(result.lastValue, result.yesterdayValue);
  return result;
};
