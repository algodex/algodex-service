const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    has_order_changes: {type: 'boolean'},
  },
  required: ['_id', 'has_order_changes'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
