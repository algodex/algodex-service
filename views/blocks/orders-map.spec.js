const ordersMap = require('./orders-map');
const fs = require('fs');
const path = require('path');

globalThis.emit = (key, val) => {
  console.log(key, val);
};

test('gets all orders', () => {
  const blockJson = fs.readFileSync(path.resolve(__dirname, './block.json'), 'utf8');
  const blockObj = JSON.parse(blockJson);
  // eslint-disable-next-line no-unused-vars
  const orders = ordersMap(blockObj);
  // FIXME - what is this test supposed to do?
});

