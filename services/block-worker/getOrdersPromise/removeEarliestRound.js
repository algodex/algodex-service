const removeEarliestRound = (rows, round) => {
  if (!rows.length) {
    return [];
  }
  const newRows = rows.filter(row => row.value.earliestRound <= round)
      .map(row => {
        return {...row};
      })
      .map(row => {
        delete row.value['earliestRound'];
        delete row.value['round'];
        return row;
      });
  return newRows;
};

module.exports = removeEarliestRound;
