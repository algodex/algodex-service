const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    data: {
      type: 'object',
      properties: {
        indexerInfo: {...require('./indexed_escrow')()},
        escrowInfo: {...require('./props/escrow-info')()},
        lastUpdateUnixTime: {type: 'integer'},
        lastUpdateRound: {type: 'integer'},
      },
      required: ['indexerInfo', 'escrowInfo', 'lastUpdateUnixTime',
        'lastUpdateRound'],
    },
  },
  required: ['_id', 'data'],
};

module.exports = () => {
  return {...schema};
};
