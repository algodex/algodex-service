const _ = require('lodash');

const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    ownerWallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    vestedRewards: {type: 'integer', minimum: 0},
    epoch: {type: 'integer', minimum: 1},
    vestedUnixTime: {type: 'integer', minimum: 0},
    assetId: {type: 'number', minimum: 0},
  },
  required: ['_id', 'ownerWallet', 'vestedRewards', 'epoch',
    'vestedUnixTime', 'assetId'],
};

module.exports = () => {
  return {...schema};
};
