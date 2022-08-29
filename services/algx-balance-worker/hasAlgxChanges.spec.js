/* eslint-disable max-len */
const blockMainnet22461067 = require('../../src/__tests__/blocks/block-mainnet-22461067.json');
const blockMainnet22461068 = require('../../src/__tests__/blocks/blocks-mainnet-22461068.json');
const blocksMainnet22471065 = require('../../src/__tests__/blocks/blocks-mainnet-22471065.json');
const hasAlgxChanges = require('./hasAlgxChanges');


it('has algx changes', () => {
  process.env.ALGX_ASSET_ID='724480511';
  expect(hasAlgxChanges(blockMainnet22461067)).toBe(true);
  expect(hasAlgxChanges(blockMainnet22461068)).toBe(false);
  expect(hasAlgxChanges(blocksMainnet22471065)).toBe(true);
});
