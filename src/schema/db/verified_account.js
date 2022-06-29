const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    status: {type: 'string'},
    version: {type: 'string'},
  },
  required: ['_id', 'status', 'version'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
