const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    noAccountInfo: {type: 'boolean'},
    assetId: {type: 'string', pattern: '[0-9]+'},
    balance: {type: 'integer'},
  },
  oneOf: [
    {required: ['noAccountInfo']},
    {required: ['assetId', 'balance']},
  ],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
