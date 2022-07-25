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
    unix_time: {type: 'integer'},
    from_wallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
  },
  required: ['_id', 'data'],
};

module.exports = () => {
  return {...schema};
};
