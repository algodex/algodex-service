const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    assetId: {type: 'string', pattern: '[0-9]+'},
    balance: {type: 'integer'},
  },
  required: ['_id', 'assetId', 'balance'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
