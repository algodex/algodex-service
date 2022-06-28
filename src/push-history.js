module.exports = (data, historyEntry) => {
  const history = data.history || [];
  if (!history.find( (a) => a.round === historyEntry.round)) {
    history.push(historyEntry);
  }
  history.sort((a, b) => (a.round > b.round) ? 1 : -1);
  data.history = history;
};

