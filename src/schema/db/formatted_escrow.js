const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    data: {
      type: 'object',
      properties: {
        indexerInfo: {...require('./indexed_escrow')()},
      },
      required: ['indexerInfo'],
    },
  },
  required: ['_id', 'data'],
};

module.exports = () => {
  return schema;
};
