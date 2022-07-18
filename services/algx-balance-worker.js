
const { _ } = require('@algodex/algodex-sdk/lib/schema');
const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');
const initOrGetIndexer = require('../src/get-indexer');
const withSchemaCheck = require('../src/schema/with-db-schema-check');
const getDirtyAccounts = require('../src/get-dirty-accounts');
const convertQueueURL = require('../src/convert-queue-url');

const addBalanceToDB = async (algxBalanceDB, doc) => {
  try {
    await algxBalanceDB.put(withSchemaCheck('algx_balance', doc));
  } catch (err) {
    if (err.error === 'conflict') {
      console.error(err);
    } else {
      throw err;
    }
  }
};

const checkInDB = async (algxBalanceDB, round) => {
  try {
    const isInDB = await algxBalanceDB.get(''+round);
    if (isInDB) {
      return true;
    }
  } catch (e) {
    if (e.error === 'not_found') {
      return false;
    } else {
      throw e;
    }
  }
  return false;
};

const getCurrentBalanceMap = async (algxBalanceDB, accounts) => {
  const result = await algxBalanceDB.query('algx_balance/algx_balance',
      {reduce: true, group: true, keys: accounts});
  const rows = result.rows;
  return rows.reduce( (map, row) => {
    const owner = row.key;
    const balance = row.value;
    map.set(owner, balance);
    return map;
  }, new Map());
};

const getChangedAccountValues = (ownerToBalanceWithRounds, block) => {
  if (!block.txns) {
    return [];
  }
  const algxAssetId = process.env.ALGX_ASSET_ID;
  if (algxAssetId === undefined) {
    throw new Error('process.env.ALGX_ASSET_ID is not defined!');
  }

  const ownerToBalance = Array.from(ownerToBalanceWithRounds.entries())
      .reduce((map, entry) => {
        map.set(entry[0], entry[1].balance);
        return map;
      }, new Map());

  const newOwnerToBalance = block.txns.map(txn => txn.txn)
      .filter(txn => txn.type === 'axfer')
      .filter(txn => txn.xaid === parseInt(algxAssetId))
      .reduce((ownerToBalance, txn) => {
        //aamt, //arcv, snd, aclose
        const sender = txn.snd;
        const receiver = txn.arcv;
        const aclose = txn.aclose;
        let senderBalance = ownerToBalance.get(sender) || 0;
        let receiverBalance =
          receiver ? (ownerToBalance.get(receiver) || 0) : 0;
        let closeReceiverBalance =
          aclose ? (ownerToBalance.get(aclose) || 0) : 0;
        const amount = txn.aamt || 0;

        receiverBalance += amount;
        closeReceiverBalance += Math.max(0, (senderBalance - amount));
        senderBalance = Math.max(0, senderBalance - amount);
        if (aclose) {
          senderBalance = 0;
          ownerToBalance.set(aclose, closeReceiverBalance);
        }
        if (sender) {
          ownerToBalance.set(sender, senderBalance);
        }
        if (receiver) {
          ownerToBalance.set(receiver, receiverBalance);
        }
        return ownerToBalance;
      }, new Map(ownerToBalance));
  if (newOwnerToBalance.size === 0) {
    return [];
  }
  const keys = Array.from(newOwnerToBalance.keys());
  const changedAccounts = keys.reduce((set, key) => {
    if (newOwnerToBalance.get(key) !== ownerToBalance.get(key)) {
      set.add(key);
    }
    return set;
  }, new Set());
  const retarr = Array.from(changedAccounts)
      .filter(account => newOwnerToBalance.has(account))
      .map(account => {
        if (typeof newOwnerToBalance.get(account) === 'object') {
          throw new Error('incorrect type');
        }
        return {
          account,
          balance: newOwnerToBalance.get(account) || 0,
        };
      });
  return retarr;
};

module.exports = ({queues, databases}) => {
  if (!process.env.ALGX_ASSET_ID) {
    throw new Error('ALGX_ASSET_ID is not set!');
  }
  const algxBalanceDB = databases.algx_balance;

  const algxBalanceWorker = new Worker(convertQueueURL('algxBalance'), async job => {
    const block = job.data;
    const round = job.data.rnd;
    console.log(`Got job! Round: ${round}`);
    const isInDB = await checkInDB(algxBalanceDB, round);
    if (isInDB) {
      // Nothing to do
      return;
    }
    const dirtyAccounts = getDirtyAccounts(block);
    const ownerToLastBalance =
      await getCurrentBalanceMap(algxBalanceDB, dirtyAccounts);
    const changedAccountData =
      getChangedAccountValues(ownerToLastBalance, block);

    if (changedAccountData.length > 0) {
      console.log('has changes!');
      console.log('has changes!');
      
    }
    await addBalanceToDB(algxBalanceDB, {
      _id: round+'',
      changes: changedAccountData,
    });
  }, {connection: queues.connection, concurrency: 50});

  algxBalanceWorker.on('error', err => {
    console.error( {err} );
    throw err;
  });
};

