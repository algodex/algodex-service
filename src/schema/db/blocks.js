const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string', pattern: '[0-9]+'},
    _rev: {type: 'string'},
    rnd: {type: 'integer'},
    tc: {type: 'integer'},
    ts: {type: 'integer'},
    txns: {type: 'array', uniqueItems: true,
      items: {
        type: 'object',
        properties: {
          hgi: {type: 'boolean'},
          sig: {type: 'string'},
          txn: {
            type: 'object',
            properties: {
              amt: {type: 'integer'},
              aamt: {type: 'integer'},
              fee: {type: 'integer'},
              note: {type: 'string'},
              rcv: {type: 'string'},
              snd: {type: 'string'},
              arcv: {type: 'string'},
              // More properties possible here
            },
          },
        },
        required: ['hgi', 'sig', 'txn'],
      },
    },
  },
  required: ['_id', 'rnd', 'tc', 'ts'],
  additionalProperties: true,
};

module.exports = () => {
  return {...schema};
};
