const initWalletToRewards = (escrowAddrs) => {
  return escrowAddrs.reduce( (map, addr) => {
    map[addr] = 0;
    return map;
  }, {});
};

module.exports = initWalletToRewards;
