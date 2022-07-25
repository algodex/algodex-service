const _ = require('lodash');

const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    to_wallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    amount: {type: 'integer'},
    assetId: {type: 'integer'},
    epoch: {type: 'integer'},
    network: {type: 'string'},
    accrualNetwork: {type: 'string'},
    unix_time: {type: 'integer'},
    result: {type: 'string'},
    from_wallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    error: {type: 'string'},
  },
  required: ['_id', 'to_wallet', 'amount', 'result',
    'assetId', 'epoch', 'network', 'unix_time', 'accrualNetwork',
    'from_wallet'],
};

module.exports = () => {
  return {...schema};
};
