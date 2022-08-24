const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string', pattern: '^[0-9]+$'},
    _rev: {type: 'string'},
    changes: {type: 'array', uniqueItems: true, items: {
      type: 'object',
      properties: {
        account: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
        balance: {type: 'integer'},
      },
      required: ['account', 'balance'],
    }},
    unix_time: {type: 'integer'},
  },
  required: ['changes', '_id', 'unix_time'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
