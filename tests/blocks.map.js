

const {PROJECT_ROOT} = require('../../constants');
const block = require(
    `${PROJECT_ROOT}/tests/fixtures/blocks-testnet-16951642.json`,
);
block._id = 16951642;

const index = {};

globalThis.emit = (k, v)=>{
  index[k] = v;
};

test('map', async () => {
  const map = require('../orders/map');
  map(block);
  expect(index).toEqual({
    '16951642': {
      'order': {
        'assetId': 15322902,
        'denominator': 20,
        'minimum': 0,
        'numerator': 1,
        'orderInfo': 'MS0yMC0wLTE1MzIyOTAy',
      },
      'type': 'open',
    },
  });
});
