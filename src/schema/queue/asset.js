const schema = {
  type: 'object',
  properties: {
    assetId: {type: 'integer', minimum: 1},
  },
  required: ['assetId'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
