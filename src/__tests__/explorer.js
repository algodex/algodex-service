const InvalidConfiguration = require('../errors/InvalidConfiguration');
const {PROJECT_ROOT} = require('../../constants');
const explorer = require('../explorer');

describe('Algorand Suite', ()=>{
  test('get a block from explorer', async () => {
    await explorer.getBlock({round: 1986})
        .catch((e) => expect(e).toBeInstanceOf(InvalidConfiguration));

    process.env.ALGORAND_EXPLORER = 'https://testnet.algoexplorerapi.io';
    process.env.ALGORAND_DAEMON = 'localhost';
    process.env.ALGORAND_DAEMON_PORT = 8080;
    process.env.ALGORAND_DAEMON_TOKEN = '308c0179ca4846ffaf06de22b1231b181313973a081721ea357c612a3bbcef04';
    const block = await explorer.getBlock({round: 1986});
    expect(block).toEqual(require(
        `${PROJECT_ROOT}/tests/fixtures/block-testnet-1986.json`,
    ));
  });

  test('wait for block from explorer', async () => {
    await explorer.waitForBlock({round: 1986})
        .catch((e) => expect(e).toBeInstanceOf(InvalidConfiguration));

    process.env.ALGORAND_EXPLORER = 'https://testnet.algoexplorerapi.io';
    process.env.ALGORAND_DAEMON = 'localhost';
    process.env.ALGORAND_DAEMON_PORT = 8080;
    process.env.ALGORAND_DAEMON_TOKEN = '308c0179ca4846ffaf06de22b1231b181313973a081721ea357c612a3bbcef04';
    const block = await explorer.waitForBlock({round: 1986});
    expect(block['last-round']).toBeGreaterThan(0);
  });

  test('get applications block range', async () => {
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
        .catch((e) => expect(e).toBeInstanceOf(InvalidConfiguration));

    process.env.ALGORAND_EXPLORER = 'https://testnet.algoexplorerapi.io';
    process.env.ALGORAND_DAEMON = 'localhost';
    process.env.ALGORAND_DAEMON_PORT = 8080;
    process.env.ALGORAND_DAEMON_TOKEN = '308c0179ca4846ffaf06de22b1231b181313973a081721ea357c612a3bbcef04';
    const range = await explorer.getAppsBlockRange(apps);

    expect(range.start).toEqual(15915387);
    expect(range.current).toBeGreaterThanOrEqual(15915387);
  });
});
