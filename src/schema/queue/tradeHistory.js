const schema = {
  type: 'object',
  properties: {
    block: {type: 'string', pattern: '^[0-9]+$'},
  },
  required: ['block'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
