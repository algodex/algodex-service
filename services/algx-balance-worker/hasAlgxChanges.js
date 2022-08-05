const hasAlgxChanges = block => {
  if (!block.txns) {
    return false;
  }
  const algxAssetId = process.env.ALGX_ASSET_ID;
  if (algxAssetId === undefined) {
    throw new Error('process.env.ALGX_ASSET_ID is not defined!');
  }

  const algxTransfer = block.txns.map(txn => txn.txn)
      .filter(txn => txn.type === 'axfer')
      .filter(txn => txn.xaid === parseInt(algxAssetId))
      .find(txn => txn.aamt && txn.aamt > 0);
  if (!algxTransfer) {
    return false;
  }
  return true;
};

module.exports = hasAlgxChanges;
