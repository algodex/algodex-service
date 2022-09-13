/* eslint-disable max-len */
// @ts-nocheck
// eslint-disable-next-line require-jsdoc, no-unused-vars
require('dotenv').config();
globalThis.emit = function(a, b) {};

const databases = [
  {
    dbName: 'blocks',
    appendOnly: true,
    design: {
      _id: '_design/blocks',
      views: {
        orders: {
          map: require('../../views/blocks/orders-map').toString(),
          reduce: require('../../views/blocks/orders-reduce').toString(),
        },
        tradeHistory: {
          map: require('../../views/blocks/tradeHistory-map').toString(),
        },
        algxRewardsOptin: {
          map: require('../../views/blocks/algxRewardsOptin-map').toString(),
        },
        approxBalance: {
          map: require('../../views/blocks/approxBalance-map').toString(),
        },
        blockToTime: {
          map: require('../../views/blocks/blockToTime-map').toString(),
        },
        ohlc: {
          map: require('../../views/chart/map').toString(),
          reduce: require('../../views/chart/reduce').toString(),
        },
        maxBlock: {
          map: require('../../views/blocks/maxBlock-map').toString(),
          reduce: require('../../views/blocks/maxBlock-reduce').toString(),
        },
        tinymanTrades: {
          map: require('../../views/blocks/tinymanTrades-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'algx_balance',
    appendOnly: true,
    design: {
      _id: '_design/algx_balance',
      views: {
        algx_balance: {
          map: require('../../views/algx_balance/algx_balance-map').toString(),
          reduce: require('../../views/algx_balance/algx_balance-reduce').toString(),
        },
        algx_balance2: {
          map: require('../../views/algx_balance/algx_balance2-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'formatted_escrow',
    design: {
      _id: '_design/formatted_escrow',
      views: {
        orders: {
          map: require('../../views/formatted_orders/orders-map').toString(),
        },
        epochs: {
          map: require('../../views/formatted_orders/epochs-map').toString(),
        },
        orderLookup: {
          map: require('../../views/formatted_orders/orderLookup-map').toString(),
        },
        distinctDates: {
          map: require('../../views/formatted_orders/distinctDates-map').toString(),
          reduce: '_count',
        },
        openOrderCount: {
          map: require('../../views/formatted_orders/openOrderCount-map').toString(),
          reduce: '_count',
        },
        spreads: {
          map: require('../../views/formatted_orders/spreads-map').toString(),
          reduce: require('../../views/formatted_orders/spreads-reduce').toString(),
        },
      },
    },
  },
  {
    dbName: 'escrow',
    appendOnly: true,
    design: {
      _id: '_design/escrow',
      views: {
        escrowAddr: {
          map: require('../../views/escrow/escrowAddr-map').toString(),
          reduce: '_count',
        },
        ownerAddr: {
          map: require('../../views/escrow/ownerAddr-map').toString(),
          reduce: '_count',
        },
      },
    },
  },
  {
    dbName: 'assets',
    appendOnly: true,
    design: {
      _id: '_design/assets',
      views: {
        assets: {
          map: require('../../views/assets/assets-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'verified_account',
    appendOnly: true,
    design: {
      _id: '_design/verified_account',
      views: {
        verifiedAddr: {
          map: require('../../views/verified_account/verifiedAddr-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'indexed_escrow',
    appendOnly: true,
  },
  {
    dbName: 'block_custom_metadata',
    appendOnly: true,
    design: {
      _id: '_design/block_custom_metadata',
      views: {
        blocks_without_changes: {
          map: require('../../views/block_custom_metadata/blocks_without_changes-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'formatted_history',
    appendOnly: true,
    design: {
      _id: '_design/formatted_history',
      views: {
        allAssets: {
          map: require('../../views/formatted_history/allAssets-map').toString(),
          reduce: require('../../views/formatted_history/allAssets-reduce').toString(),
        },
        activityView: {
          map: require('../../views/formatted_history/activityView-map.js').toString(),
          reduce: '_count',
        },
        distinctDates: {
          map: require('../../views/formatted_history/distinctDates-map.js').toString(),
        },
      },
    },
  },
  {
    dbName: 'synced_blocks',
    design: {
      _id: '_design/synced_blocks',
      views: {
        max_block: {
          map: require('../../views/synced_blocks/max_block-map').toString(),
          reduce: require('../../views/synced_blocks/max_block-reduce').toString(),
        },
        min_block: {
          map: require('../../views/synced_blocks/min_block-map').toString(),
          reduce: require('../../views/synced_blocks/min_block-reduce').toString(),
        },
      },
    },
  },
  {
    dbName: 'logging',
    appendOnly: true,
  },
  {
    dbName: 'prices',
  },
  {
    dbName: 'rewards_distribution',
    appendOnly: true,
    design: {
      _id: '_design/rewards_distribution',
      views: {
        rewards_distribution: {
          map: require('../../views/rewards_distribution/rewards_distribution-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'owner_balance',
    appendOnly: true,
    design: {
      _id: '_design/owner_balance',
      views: {
        ownerAddr: {
          map: require('../../views/owner_balance/ownerAddr-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'rewards',
    appendOnly: true,
    design: {
      _id: '_design/rewards',
      views: {
        ownerAddr: {
          map: require('../../views/rewards/rewards-map').toString(),
        },
        topWallets: {
          map: require('../../views/rewards/topWallets-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'vested_rewards',
    appendOnly: true,
    design: {
      _id: '_design/vested_rewards',
      views: {
        ownerAddr: {
          map: require('../../views/vested_rewards/vested_rewards-map').toString(),
        },
      },
    },
  },
];

const replaceEnvs = viewStr => {
  Object.keys(process.env).forEach(envKey => {
    viewStr = viewStr.replaceAll('\'<'+envKey+'>\'', process.env[envKey]);
  });
  return viewStr;
};

const withReplaceEnv = databases => {
  databases.forEach(dbObj => {
    if (dbObj.design?.views === undefined) {
      return;
    }
    Object.keys(dbObj.design.views).forEach(viewName => {
      const viewStr = replaceEnvs(dbObj.design.views[viewName].map);
      dbObj.design.views[viewName].map = viewStr;
    });
  });
  return databases;
};

module.exports = function() {
  return withReplaceEnv(databases);
};

