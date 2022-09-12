
export interface Rewards {
  _id: string,
  _rev?: string,
  ownerWallet: string,
  uptime: number,
  depthSum: number,
  qualitySum: number,
  algxAvg: number,
  qualityFinal: number,
  epoch: number,
  assetId: number,
  earnedRewards: number,
  earnedRewardsFormatted: number
}
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
    earnedRewards: {type: 'integer', minimum: 0}, // FIXME - update the script that stores this!
    earnedRewardsFormatted: {type: 'number', minimum: 0},
    epoch: {type: 'integer', minimum: 0},
    accrualAssetId: {type: 'integer', minimum: 0},
    rewardsAssetId: {type: 'integer', minimum: 0},
    updatedAt: {type: 'string'},
  },
  required: ['_id', 'ownerWallet', 'uptime', 'depthSum', 'accrualAssetId', 'rewardsAssetId',
    'qualitySum', 'algxAvg', 'qualityFinal', 'earnedRewardsFormatted', 'epoch', 'updatedAt'
   ],
};

module.exports = () => {
  return {...schema};
};
