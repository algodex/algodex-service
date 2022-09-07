const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    hasChanges: {type: 'boolean'},
    changesType: {type: 'string'},
  },
  required: ['_id', 'hasChanges', 'changesType'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
