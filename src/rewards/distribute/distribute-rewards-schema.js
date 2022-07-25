const schema = {
  type: 'object',
  properties: {
    algodClient: {type: 'object'},
    rewardsDB: {type: 'object'},
    wallets: {
      type: 'array',
      items: {type: 'string', pattern: '^[A-Z2-7]{58}$', uniqueItems: true},
    },
    amount: {type: 'integer', minimum: 1},
    epoch: {type: 'integer'},
    network: {type: 'string', pattern: '^(mainnet|testnet)$'},
    accrualNetwork: {type: 'string', pattern: '^(mainnet|testnet)$'},
    fromAccount: {
      type: 'object',
      properties: {
        addr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
      },
      required: ['addr'],
    },
    assetId: {type: 'integer'},
    indexer: {type: 'object'},
  },
  required: ['algodClient', 'rewardsDB', 'wallets',
    'amount', 'epoch', 'network', 'accrualNetwork', 'fromAccount', 'assetId',
    'indexer'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};


