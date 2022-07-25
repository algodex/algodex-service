
/**
 *
 * @param {Object} input
 * @param {Object} input.algod
 * @param {Object} input.rewardsDB
 * @param {Array.<String>} input.wallets
 * @param {Number} input.amount
 */
// eslint-disable-next-line max-len
const distributeRewards = async ({epoch, algod, rewardsDB, wallets, amount}) => {
  if (typeof(amount) !== 'number' || !isNaN(amount) || amount <= 0) {
    throw new Error('amount is not a valid number!');
  }
  if (!Array.isArray(wallets)) {
    throw new Error('wallets is not an array!');
  }
};

module.exports = distributeRewards;

