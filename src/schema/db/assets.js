const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string', pattern: '[0-9]+'},
    _rev: {type: 'string'},
    asset: {
      type: 'object',
      properties: {
        index: {type: 'integer'},
        params: {
          properties: {
            decimals: {type: 'integer'},
          },
          type: 'object',
          required: ['decimals'],
        },
      },
      required: ['index', 'params'],
    },
  },
  required: ['_id', 'asset'],
};

module.exports = () => {
  return schema;
};
