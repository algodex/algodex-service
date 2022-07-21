/* eslint-disable max-len */
// const {DatabaseMock, DatabaseExpectedErrorMock, DatabaseBadErrorMock} =
//   require('../../src/__mocks__/DatabaseMock');

const getOrdersPromise = require('./getOrdersPromise');
jest.mock('../../src/verify-contracts', () =>
  jest.fn(input => new Promise(resolve => resolve(input))));
jest.mock('./getOrdersPromise/getAssetsAndOrdersPromises', () =>
  jest.fn(input => [new Promise(resolve => resolve(input))]));
jest.mock('./getOrdersPromise/removeEarliestRound', () =>
  jest.fn(input => input));
const {DatabaseMock,
  DatabaseExpectedErrorMock,
  DatabaseBadErrorMock, NotFoundError, UnexpectedError} =
    require('../../src/__mocks__/DatabaseMock');


DatabaseMock.query = jest.fn(() => new Promise(resolve => {
  resolve({rows: ['address info rows']});
}));
DatabaseExpectedErrorMock.query = jest.fn(() => new Promise(resolve => {
  throw new NotFoundError;
}));
DatabaseBadErrorMock.query = jest.fn(() => new Promise(resolve => {
  throw new UnexpectedError;
}));

// FIXME: call below
const verifyContracts = require('../../src/verify-contracts');
const getAssetsAndOrdersPromises =
  require('./getOrdersPromise/getAssetsAndOrdersPromises');
const removeEarliestRound = require('./getOrdersPromise/removeEarliestRound');
const blockData = require('../../src/__tests__/schema/db/blocks.json');

it('gets Orders Promise', async () => {
  const ordersPromise = await getOrdersPromise({databases:
      {blocks: DatabaseMock},
  queues: 'queues',
  dirtyAccounts: [
    'ZW3ISEHZUHPO7OZGMKLKIIMKVICOUDRCERI454I3DB2BH52HGLSO67W754',
    '7OZYRTWBOKOFGGGF2EYV4TSWSG5XOAKQAD3XYH2BHK5XZ4RJTW3HEFDMA4',
  ],
  blockData});
  expect(ordersPromise).toEqual(orderPromiseExpectedResults);
});

it('throws error when not found', async () => {
  try {
    const ordersPromise = await getOrdersPromise({databases:
        {blocks: DatabaseBadErrorMock},
    queues: 'queues',
    dirtyAccounts: [
      'ZW3ISEHZUHPO7OZGMKLKIIMKVICOUDRCERI454I3DB2BH52HGLSO67W754',
      '7OZYRTWBOKOFGGGF2EYV4TSWSG5XOAKQAD3XYH2BHK5XZ4RJTW3HEFDMA4',
    ],
    blockData});
    throw new Error('unreachable code');
  } catch (e) {
    expect(e).toBeInstanceOf(UnexpectedError);
  }
});

it('throws error when bad error', async () => {
  try {
    const ordersPromise = await getOrdersPromise({databases:
        {blocks: DatabaseExpectedErrorMock},
    queues: 'queues',
    dirtyAccounts: [
      'ZW3ISEHZUHPO7OZGMKLKIIMKVICOUDRCERI454I3DB2BH52HGLSO67W754',
      '7OZYRTWBOKOFGGGF2EYV4TSWSG5XOAKQAD3XYH2BHK5XZ4RJTW3HEFDMA4',
    ],
    blockData});
    throw new Error('unreachable code');
  } catch (e) {
    expect(e).toBeInstanceOf(Error);
  }
});

const orderPromiseExpectedResults = [
  {
    'queues': 'queues',
    'validRows': [
      'address info rows',
    ],
    'blockData': {
      '_id': '15915394',
      '_rev': '1-5392a37874ac1be33f5e20a5b3ee6be2',
      'type': 'block',
      'earn': 27521,
      'fees': 'A7NMWS3NT3IUDMLVO26ULGXGIIOUQ3ND2TXSER6EBGRZNOBOUIQXHIBGDE',
      'frac': 2020197303,
      'gen': 'testnet-v1.0',
      'gh': 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
      'prev': 'blk-7NMU65BCMNX2C23DOFLCBPZQB4PTIPOE55CMO632LJE7I5I5CFUA',
      'proto': 'https://github.com/algorandfoundation/specs/tree/65b4ab3266c52c56a0fa7d591754887d68faad0a',
      'rnd': 15915394,
      'rwcalr': 16000000,
      'rwd': '7777777777777777777777777777777777777777777777777774MSJUVU',
      'seed': 'ktm/toPkJNxnkCpYFlFlHXH40XshsFP/4qYfLEZbnGw=',
      'tc': 22045552,
      'ts': 1628519402,
      'txn': 'GgZKbWni8nw0ZFiCy2850dp6ejaeJd/EII7WaPk1dxo=',
      'txns': [
        {
          'hgi': true,
          'sig': 'S70McaGWg9gdalpGahbGSiUpc0zwYhMutfDrY1eIeV/6NMOdwnuowIT2eBsU1vKa7s9qYdmUJF3kkSR/aW+pCA==',
          'txn': {
            'amt': 1,
            'fee': 1000,
            'fv': 15915393,
            'lv': 15915398,
            'note': 'cGluZ3Bvbmda73F7QtRIHQ==',
            'rcv': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
            'snd': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
            'type': 'pay',
          },
        },
        {
          'hgi': true,
          'sig': 'D9MnTxcfwg3PyVUtM+0WZl+5c8Ii7jy1aqJsxSIBgWL4QotPKT8uGnwakHM4f0r9DTgz7uD2eO4b7mXYTllIAA==',
          'txn': {
            'amt': 1,
            'fee': 1000,
            'fv': 15915393,
            'lv': 15915398,
            'note': 'cGluZ3Bvbme2/9Ws4knF8A==',
            'rcv': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
            'snd': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
            'type': 'pay',
          },
        },
        {
          'hgi': true,
          'sig': 'gJqJQ5r7Xwiv7UXXdcUX7ETyJhSuYDhGTjN8r8QzMpuVPp3EJzb+qz7ZUGs5k9+hzRzdQGiV4vY0V2E/Rtg2BQ==',
          'txn': {
            'amt': 1,
            'fee': 1000,
            'fv': 15915393,
            'lv': 15915398,
            'note': 'cGluZ3BvbmeaY7bPTWjGbw==',
            'rcv': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
            'snd': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
            'type': 'pay',
          },
        },
        {
          'hgi': true,
          'sig': 'XSno9InmWQL7QvnKwq8xvmxYnExasPm5QEOblkX+/0jFKsqbODztHndZ5+2KPgUVHXA7oG0wDjEVJjfJ2glsDA==',
          'txn': {
            'amt': 1,
            'fee': 1000,
            'fv': 15915393,
            'lv': 15915398,
            'note': 'cGluZ3Bvbmc6Wntk9c092g==',
            'rcv': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
            'snd': 'U6QEM4KM7KKGCLH4FELZBGJEVVSF556ELXHUOZC4ESPFS4O4V4VQXKQRXQ',
            'type': 'pay',
          },
        },
      ],
    },
  },
];
