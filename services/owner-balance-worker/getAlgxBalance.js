
const getAlgxBalance = accountInfo => {
  if (!accountInfo.account || !accountInfo.account.assets) {
    return 0;
  }
  const algxAsset = accountInfo.account.assets
      .find( asset => asset['asset-id'] ===
        parseInt(process.env.ALGX_ASSET_ID));
  if (!algxAsset) {
    return 0;
  }

  return algxAsset.amount;
};

module.exports = getAlgxBalance;
