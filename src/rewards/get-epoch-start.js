const getSecondsInEpoch = require('./get-seconds-in-epoch');

const getEpochStart = (epoch) => {
  const start = parseInt(process.env.EPOCH_LAUNCH_UNIX_TIME);
  const secondsInEpoch = getSecondsInEpoch();
  return start + (secondsInEpoch * (epoch - 1));
};

module.exports = getEpochStart;
