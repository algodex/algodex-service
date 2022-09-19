const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    round: {type: 'integer'},
    cachedData: {type: 'array'},
  },
  required: ['_id', 'round', 'cachedData'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};

