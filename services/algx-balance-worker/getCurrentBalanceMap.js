const getCurrentBalanceMap = async (algxBalanceDB, accounts) => {
  const result = await algxBalanceDB.query('algx_balance/algx_balance',
      {reduce: true, group: true, keys: accounts});
  const rows = result.rows;
  return rows.reduce( (map, row) => {
    const owner = row.key;
    const balance = row.value;
    map.set(owner, balance);
    return map;
  }, new Map());
};

module.exports = getCurrentBalanceMap;
