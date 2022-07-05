
const getOwnerWalletChangeTimes = ownerBalanceToHist => {
  const timeToChangedOwners = Object.keys(ownerBalanceToHist).reduce(
      (map, owner) => {
        const historyItems = ownerBalanceToHist[owner];
        historyItems.forEach(historyItem => {
          const timeKey = 'time:'+historyItem.time;
          if (map[timeKey] === undefined) {
            map[timeKey] = [];
          }
          const ownersAtTime = map[timeKey];
          ownersAtTime.push(owner);
        });
        return map;
      }, {});
  const ownerChangeTimes =
    Object.keys(timeToChangedOwners).map(key => parseInt(key.split(':')[1]))
        .sort((a, b) => a > b ? 1 : -1);
  return {ownerChangeTimes, timeToChangedOwners};
};

module.exports = getOwnerWalletChangeTimes;
