const escrowInfo = require('../db/props/escrow-info');
const indexedEscrow = require('../db/indexed_escrow');

const schema = {
  type: 'object',
  properties: {
    indexerInfo: {...indexedEscrow},
    escrowInfo: {...escrowInfo},
    lastUpdateRound: {type: 'integer', minimum: 16000000},
    lastUpdateUnixTime: {type: 'integer', minimum: 1627861887},
  },
  required: ['indexerInfo', 'escrowInfo',
    'lastUpdateRound', 'lastUpdateUnixTime'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
