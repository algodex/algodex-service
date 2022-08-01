const blockSchema = require('../db/blocks');
const escrowInfo = require('../db/props/escrow-info');


const schema = {
  type: 'object',
  properties: {
    blockData: {...blockSchema},
    reducedOrder: {...escrowInfo},
    account: {type: 'string', pattern: '^[A-Z2-7]{58}$'},
  },
  required: ['blockData', 'reducedOrder', 'account'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
