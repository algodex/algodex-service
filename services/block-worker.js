const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const verifyContracts = require('../src/verify-contracts');
let escrowCounter = 0;
let escrowCounter2 = 0;

const getDirtyAccounts = (block) => {
  // console.log( {block} );
  if (block.txns === undefined) {
    return [];
  }
  const txnTypes = ['snd', 'rcv', 'close', 'asnd', 'arcv', 'aclose', 'fadd'];
  const dirtyAccounts = block.txns.reduce( (accounts, txn) => {
    txnTypes.forEach( (type) => {
      if (txn.txn !== undefined && txn.txn[type] !== undefined) {
        const account = txn.txn[type];
        accounts[account] = 1;
      }
    });
    return accounts;
  }, {});
  return Object.keys(dirtyAccounts);
};

const getAssetQueuePromise = (assetQueue, assetId) => {
  const assetAddJob = {assetId: assetId};
  const promise = assetQueue.add('assets', assetAddJob,
      {removeOnComplete: true}).then(function() {
    console.log('added asset: ' + assetId);
  }).catch(function(err) {
    console.error('error adding to assets queue:', {err} );
    throw err;
  });
  return promise;
};


module.exports = ({queues, databases}) =>{
  const db = databases.blocks;

  const orders = new Worker('blocks', async (job)=>{
    console.debug({
      msg: 'Received block',
      round: job.data.rnd,
    });

    // Save to database
    return db.post({_id: `${job.data.rnd}`, type: 'block', ...job.data})
        .then(async function(response) {
          console.debug({
            msg: `Block stored`,
            ...response,
          });

          // eslint-disable-next-line max-len
          const dirtyAccounts = getDirtyAccounts(job.data).map( (account) => [account] );

          return Promise.all( [db.query('blocks/orders',
              {reduce: true, group: true, keys: dirtyAccounts})
              .then(async function(res) {
                if (!res?.rows?.length) {
                  return;
                }
                escrowCounter += res.rows.length;
                const assetIdSet = {};
                const validRows = await verifyContracts(res.rows, databases.escrow);

                const allPromises = validRows.reduce( (allPromises, row) => {
                  // add job

                  const key = row.key;
                  console.log('got account', {key});
                  const account = row.key[0];

                  console.log({account});
                  const ordersJob = {account: account,
                    blockData: job.data, reducedOrder: row};

                  const assetId = row.value.assetId;
                  if (!('assetId:assetIds' in assetIdSet)) {
                    assetIdSet[assetId] = 1;
                    const assetAddPromise = getAssetQueuePromise(
                        queues.assets,
                        assetId,
                    );
                    allPromises.push(assetAddPromise);
                  }

                  const promise = queues.orders.add('orders', ordersJob,
                      {removeOnComplete: true}).then(function() {
                    escrowCounter2++;
                    console.log(
                        'COUNTERS: ' + escrowCounter + ' ' + escrowCounter2,
                    );
                  }).catch(function(err) {
                    console.error('error adding to orders queue:', {err} );
                    throw err;
                  });
                  allPromises.push(promise);
                  return allPromises;
                  // console.log('adding to orders');
                }, []);
                // console.log('promises length:' + allPromises);
                return Promise.all(allPromises);
                // got the query results
                // console.log('found dirty escrow! '+ res.rows[0]);

                // console.log ({res});
              }).catch(function(err) {
                if (err.error === 'not_found') {
                  // console.log('not found');
                  throw err;
                } else {
                  console.log('reducer error!!!');
                  console.log(err);
                  throw err;
                }
              }),
          queues.tradeHistory.add('tradeHistory', {block: `${job.data.rnd}`},
              {removeOnComplete: true}).then(function() {
          }).catch(function(err) {
            console.error('error adding to orders queue:', {err} );
            throw err;
          }),
          ]);
        }).catch(function(err) {
          // console.log('error here', {err});
          if (err.error === 'conflict') {
            console.error('already added!');
          } else {
            throw err;
          }
        });
  }, {connection: queues.connection, concurrency: 50});

  orders.on('error', (err) => {
    console.error( {err} );
  });
};

