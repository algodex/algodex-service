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

const initOrGetIndexer = () => {
  if (indexerClient !== null) {
    return indexerClient;
  }
  const algosdk = require('algosdk');
  const baseServer = "https://testnet-algorand.api.purestake.io/idx2";
  const port = "";
  
  const token = {
      'X-API-key': 'VELyABA1dGqGbAVktbew4oACvp0c0298gMgYtYIb',
  }
  
  indexerClient = new algosdk.Indexer(token, baseServer, port);
  return indexerClient;
}

module.exports = ({queues, db, escrowDB}) =>{
  // Lighten the load on the broker and do batch processing
  console.log({escrowDB});
  const orders = new Worker('blocks', async (job)=>{
    console.debug({
      msg: 'Received block',
      round: job.data.rnd,
    });
    // Save to database
    db.post({_id: `${job.data.rnd}`, type: 'block', ...job.data})
        .then(function(response) {
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
          db.query('dex/orders',
              {reduce: true, group: true, keys: dirtyAccounts})
              .then(function(res) {
                if (!res?.rows?.length) {
                  return;
                }
                res.rows.forEach( (row) => {
                  const account = row.key[0];
                  const indexerClient = initOrGetIndexer();
                  const round = job.data.rnd;
                  const accountInfoPromise = indexerClient.lookupAccountByID(account).round(round).do();
                  accountInfoPromise.then(function(accountInfo) {
                    console.log(accountInfo);
                    console.log('here57');
                    const data = {indexerInfo: accountInfo, escrowInfo: row.value};
                    data.lastUpdateUnixTime = job.data.ts;
                    data.lastUpdateRound = job.data.rnd;
                    escrowDB.post({_id: `${account}-${job.data.rnd}`, type: 'block', data: data})
                        .then(function(response) {
                          console.debug({
                            msg: `Escrow Analytics Block stored`,
                            ...response,
                          });
                        }).catch(function(err) {
                          console.error(err);
                        });


                  }).catch(function (err) {
                    console.log({err});
                  });
                  //.then(function (res) {
                    //console.log({accountInfo});

                  //});
                });
                // got the query results
                console.log('found dirty escrow! '+ res.rows[0]);

                console.log ({res});

              }).catch(function (err) {
                console.log({err});
              });

        }).catch(function(err) {
          if (err.error === 'conflict') {
            console.error(err);
          } else {
            throw err;
          }
        });
    
  }, {connection: queues.connection, concurrency: 50});

  orders.on('error', (err) => {
    console.error(err);
  });
};

