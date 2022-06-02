const databases = [
  {
    dbName: 'blocks',
    appendOnly: true,
    design: {
      _id: '_design/blocks',
      views: {
        orders: {
          map: require('../views/blocks/orders-map').toString(),
          reduce: require('../views/blocks/orders-reduce').toString(),
        },
        tradeHistory: {
          map: require('../views/blocks/tradeHistory-map').toString(),
        },
        ohlc: {
          map: require('../views/chart/map').toString(),
          reduce: require('../views/chart/reduce').toString(),
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
          map: require('../views/formatted_orders/orders-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'escrow',
    design: {
      _id: '_design/escrow',
      views: {
        escrowAddr: {
          map: require('../views/escrow/escrowAddr-map').toString(),
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
          map: require('../views/assets/assets-map').toString(),
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
          map: require('../views/verified_account/verifiedAddr-map').toString(),
        },
      },
    },
  },
  {
    dbName: 'indexed_escrow',
    appendOnly: true,
  },
  {
    dbName: 'formatted_history',
  },
  {
    dbName: 'prices',
  },
];

module.exports = function() {
  return databases;
};

