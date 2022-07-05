module.exports = block => {
  // console.log( {block} );
  if (block.txns === undefined) {
    return [];
  }
  const txnTypes = ['snd', 'rcv', 'close', 'asnd', 'arcv', 'aclose', 'fadd'];
  const dirtyAccounts = block.txns.reduce( (accounts, txn) => {
    txnTypes.forEach( type => {
      if (txn.txn !== undefined && txn.txn[type] !== undefined) {
        const account = txn.txn[type];
        accounts[account] = 1;
      }
    });
    return accounts;
  }, {});
  return Object.keys(dirtyAccounts);
};

