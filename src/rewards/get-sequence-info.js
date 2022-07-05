
const getSequenceInfo = escrows => {
  const unixTimeToChangedEscrows = escrows.reduce( (timeline, escrow) => {
    const times = escrow.data.history.map(historyItem => historyItem.time);
    times.forEach( time => {
      const key = 'ts:'+time;
      if (!(key in timeline)) {
        timeline[key] = [];
      }
      const addrArr = timeline[key];
      addrArr.push(escrow._id); // push escrow address
    });
    return timeline;
  }, {});

  const changedEscrowSeq = Object.keys(unixTimeToChangedEscrows)
      .map(key => parseInt(key.split(':')[1]));
  changedEscrowSeq.sort();

  return {unixTimeToChangedEscrows, changedEscrowSeq};
};

module.exports = getSequenceInfo;

