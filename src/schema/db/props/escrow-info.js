// "escrowInfo": {
//   "isAlgoBuyEscrow": true,
//   "type": "open",
//   "orderInfo": "10-15-0-15322902",
//   "numerator": 10,
//   "assetId": 15322902,
//   "denominator": 15,
//   "minimum": 0,
//   "price": 1.5,
//   "ownerAddr": "YMIHGTLM72XH434HHI3BAQLXTGC6CKG2XVCU3F2ARIDFCNNYUIB5SJ3K4E",
//   "block": "16583614",
//   "ts": 1631353290,
//   "version": "\u0003",
//   "status": "open"
// },

const schema = {
  type: 'object',
  properties: {
    isAlgoBuyEscrow: {type: 'boolean'},
    apat: {type: 'array'},
    type: {type: 'string'},
    orderInfo: {type: 'string'},
    numerator: {type: 'integer'},
    assetId: {type: 'integer'},
    denominator: {type: 'integer'},
    minimum: {type: 'integer'},
    price: {type: 'number'},
    ownerAddr: {type: 'string', pattern: '[A-Z2-7]{58}'},
    block: {type: 'string', pattern: '[0-9]+'},
    ts: {type: 'integer'},
    version: {type: ['string', 'null']}, // FIXME: https://github.com/algodex/algodex-service/issues/27
    status: {type: 'string'},
  },
  required: ['isAlgoBuyEscrow', 'type', 'orderInfo', 'numerator',
    'assetId', 'denominator', 'minimum', 'price', 'ownerAddr',
    'block', 'ts', 'version', 'status'],
  additionalProperties: false,
};

module.exports = () => {
  return {...schema};
};
