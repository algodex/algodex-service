const getEpochStart = require('./get-epoch-start');
const getSecondsInEpoch = require('./get-seconds-in-epoch');

const getEpochEnd = (epoch) => {
  return getEpochStart(epoch) + getSecondsInEpoch();
};

module.exports = getEpochEnd;
