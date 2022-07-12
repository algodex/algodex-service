const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string', pattern: '^[0-9]+$'},
    _rev: {type: 'string'},
  },
  required: ['_id'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
