const bullmq = require('bullmq');
const Worker = bullmq.Worker;
const algosdk = require('algosdk');

let indexerClient = null;

const getDirtyAccounts = (block) => {
  console.log( {block} );
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

module.exports = ({queues, db, escrowDB}) =>{
  const orders = new Worker('blocks', (job)=>{
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
          //const dirtyAccounts = [['NCL6MAVCMFKRM7NHOZZX3ZK7HBR52CD2UEZI5M3TYNAFUQUREJCRD5CALI']];
          //const dirtyAccount = '["ZKJV3VOLBC7E4ZRXCZALGYZ5DS7VGN7EGTBKIBKJLYE3MNQ5GKSZNYRL7E"]';
          //console.log({dirtyAccounts});
          console.log('here55');
          console.log('dirty accounts are: ', 
            dirtyAccounts.reduce( (account, accounts) => accounts + "," + account), "");
          return db.query('dex/orders',
              {reduce: true, group: true, keys: dirtyAccounts})
              .then(function(res) {
                if (!res?.rows?.length) {
                  return;
                }
                
                const allPromises = res.rows.reduce( (allPromises, row) => {
                  //add job
                  const key = row.key;
                  console.log('got account', {key});
                  const account = row.key[0];
                  console.log({account});
                  const ordersJob = {account: account,
                    blockData: job.data, reducedOrder: row};
                  const promise = queues.orders.add('orders', ordersJob,
                    {removeOnComplete: false});
                  allPromises.push(promise);
                  return allPromises;
                 // console.log('adding to orders');
                }, []);
                console.log('promises length:' + allPromises);
                return Promise.all(allPromises);
                // got the query results
                //console.log('found dirty escrow! '+ res.rows[0]);

                //console.log ({res});

              }).catch(function (err) {
                if (err.error === 'not_found') {
                  //console.log('not found');
                  throw err;

                } else {
                  console.log('reducer error!!!');
                  console.log(err);
                  throw err;
                }
              });
        }).catch(function(err) {
          console.log('error here', {err});
          if (err.error === 'conflict') {
            console.error(err);
          } else {
            throw err;
          }
        });
    
  }, {connection: queues.connection, concurrency: 50});

  orders.on('error', (err) => {
    console.error( {err} );
  });
};

