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
        assetDecimals: {type: 'integer'},
        history: {type: 'array', minItems: 1, uniqueItems: true,
          items: {
            type: 'object',
            properties: {
              algoAmount: {type: 'integer'},
              asaAmount: {type: 'integer'},
              time: {type: 'integer'},
              round: {type: 'integer'},
            },
            oneOf: [
              {required: ['time', 'round', 'algoAmount']},
              {required: ['time', 'round', 'asaAmount']},
            ],
          },
        },

      },
      required: ['indexerInfo', 'escrowInfo', 'lastUpdateUnixTime',
        'lastUpdateRound', 'assetDecimals', 'history'],
    },
  },
  required: ['_id', 'data'],
};

module.exports = () => {
  const retSchema = {...schema};
  // Don't allow null values
  retSchema.properties.data
      .properties.escrowInfo.properties.version.type = 'string';
  return retSchema;
};
