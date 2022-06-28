const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    address: {type: 'string'},
    algoAmount: {type: 'integer'},
    round: {type: 'integer'},
    asaAmount: {type: 'integer'},
    isApproximate: {type: 'boolean'},
  },
  required: ['_id', 'address', 'algoAmount', 'round',
    'asaAmount'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
