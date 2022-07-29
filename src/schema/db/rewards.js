const _ = require('lodash');

const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    ownerWallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    uptime: {type: 'integer', minimum: 0},
    depthSum: {type: 'number', minimum: 0},
    qualitySum: {type: 'number', minimum: 0},
    algxAvg: {type: 'number', minimum: 0},
    qualityFinal: {type: 'number', minimum: 0},
    earnedRewards: {type: 'number', minimum: 0},
    epoch: {type: 'number', minimum: 0},
    assetId: {type: 'number', minimum: 0},
  },
  required: ['_id', 'ownerWallet', 'uptime', 'depthSum',
    'qualitySum', 'algxAvg', 'qualityFinal', 'earnedRewards', 'epoch',
    'assetId'],
};

module.exports = () => {
  return {...schema};
};
