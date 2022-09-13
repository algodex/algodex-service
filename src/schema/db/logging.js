const schema = {
  type: 'object',
  properties: {
    _id: {type: 'string'},
    _rev: {type: 'string'},
    severity: {type: 'string'},
    message: {type: 'string'},
    environment: {type: 'string'},
    href: {type: 'string'},
    unixTime: {type: 'integer'},
    ipAddress: {type: 'string'},
  },
  required: ['severity', 'message',
    'environment', 'href', 'unixTime', 'ipAddress'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
