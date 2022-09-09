export interface VestedRewards {
  _id: string,
  _rev?: string,
  ownerWallet: string,
  vestedRewards: number,
  formattedVestedRewards: number,
  epoch: number,
  vestedUnixTime: number,
  sentAssetId: number,
  accrualAssetId: number,
  result: string,
  transactionId: string,
  fromWallet: string,
  error?: string
}

export const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    ownerWallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    vestedRewards: {type: 'integer', minimum: 0},
    formattedVestedRewards: {type: 'number', minimum: 0},
    epoch: {type: 'integer', minimum: 1},
    vestedUnixTime: {type: 'integer', minimum: 0},
    sentAssetId: {type: 'number', minimum: 0},
    accrualAssetId: {type: 'number', minimum: 0},
    result: {type: 'string'},
    transactionId: {type: 'string'},
    fromWallet: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    error: {type: 'string'},
  },
  required: ['_id', 'ownerWallet', 'vestedRewards', 'formattedVestedRewards', 'epoch',
    'vestedUnixTime', 'sentAssetId', 'accrualAssetId', 'result', 'transactionId', 'fromWallet'],
};

