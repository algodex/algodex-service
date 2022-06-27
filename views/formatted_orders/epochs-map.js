module.exports = function(doc) {
  const unixToEpoch = (unixTime) => {
    const rounded = Math.floor(unixTime);
    const start = 1629950400; // start time. change mainnet or testnet
    const secondsInEpoch = 604800 * 2;
    return Math.floor((rounded - start) / secondsInEpoch) + 1;
  };

  const getEpochFromEscrow = (escrow) => {
    const history = escrow.history;
    let startTime = null;
    let endTime = null;
    const epochSet = {};
    for (let i = 0; i < history.length; i++) {
      const hasBalance = history[i].asaAmount > 0 || history[i].algoAmount > 0;
      if (startTime === null && hasBalance) {
        startTime = history[i].time;
      } else if (startTime !== null && !hasBalance) {
        endTime = history[i].time;
        const startEpoch = unixToEpoch(startTime);
        const endEpoch = unixToEpoch(endTime);
        const epochCount = endEpoch - startEpoch + 1;
        const epochs = Array(epochCount).fill().map((element, index) => index + startEpoch);
        epochs.forEach((epoch) => epochSet[`epoch:${epoch}`] = 1);
        startTime = null;
        endTime = null;
      }
    }
    const lastIndex = history.length - 1;
    let stillOpen = false;
    if (history[lastIndex].asaAmount > 0 || history[lastIndex].algoAmount > 0) {
      const lastEpoch = unixToEpoch(history[lastIndex].time);
      epochSet[`epoch:${lastEpoch}`] = 1;
      stillOpen = true;
    }
    return {
      epochs: Object.values(epochSet),
      stillOpen,
    };
  };

  if (doc.data === undefined) {
    return;
  }
  if (doc.data.history === undefined) {
    return;
  }
  if (doc.data.history.length === 0) {
    return;
  }

  const historyData = {
    address: doc._id,
    history: doc.data.history,
  };

  const epochData = getEpochFromEscrow(historyData);
  epochData.epochs.forEach((epoch) => {
    emit(epoch, doc._id);
  });
  if (epochData.stillOpen) {
    emit('stillOpen', doc._id);
  }
};
