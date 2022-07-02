const {InvalidConfiguration} = require('../Errors');
const explorer = require('../explorer');

test.skip('get a block from explorer', async () => {
  await explorer.getBlock({round: 1986})
      .catch(e => expect(e).toBeInstanceOf(InvalidConfiguration));

  process.env.ALGORAND_EXPLORER = 'https://api.testnet.algoexplorer.io';
  const block = await explorer.getBlock({round: 1986});
  expect(block).toEqual(require('./block-testnet-1986.json'));
});

test.skip('wait for block from explorer', async () => {
  await explorer.waitForBlock({round: 1986})
      .catch(e => expect(e).toBeInstanceOf(InvalidConfiguration));

  process.env.ALGORAND_EXPLORER = 'https://api.testnet.algoexplorer.io';
  const block = await explorer.waitForBlock({round: 1986});
  expect(block['last-round']).toBeGreaterThan(0);
});

test.skip('get applications block range', async () => {
  const apps =[
    {
      id: 22045503,
      genesis: undefined,
    },
    {
      id: 22045522,
      genesis: undefined,
    },
  ];

  await explorer.getAppsBlockRange(apps)
      .catch(e => expect(e).toBeInstanceOf(InvalidConfiguration));

  process.env.ALGORAND_EXPLORER = 'https://testnet.algoexplorerapi.io';
  const range = await explorer.getAppsBlockRange(apps);

  expect(range.start).toEqual(15915387);
  expect(range.current).toBeGreaterThanOrEqual(15915387);
});
