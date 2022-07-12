const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    tradeType: {type: 'string'},
    executeType: {type: 'string'},
    escrowAddr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    groupId: {type: 'string'},
    algoAmount: {type: 'integer'},
    assetSellerAddr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    asaAmount: {type: 'integer'},
    asaId: {type: 'integer'},
    assetBuyerAddr: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
    block: {type: 'integer'},
    unixTime: {type: 'integer'},
    assetDecimals: {type: 'integer'},
  },
  required: ['_id', 'tradeType', 'executeType', 'escrowAddr', 'groupId',
    'algoAmount', 'assetSellerAddr', 'asaAmount', 'asaId', 'assetBuyerAddr',
    'block', 'unixTime', 'assetDecimals'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
