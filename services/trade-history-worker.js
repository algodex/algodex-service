const bullmq = require('bullmq');
const Worker = bullmq.Worker;
// const algosdk = require('algosdk');

module.exports = ({queues, databases}) =>{
  const blockDB = databases.blocks;
  const escrowDB = databases.escrow;
  const assetDB = databases.assets;
  const formattedHistoryDB = databases.formatted_history;

  // Lighten the load on the broker and do batch processing
  console.log({blockDB});
  console.log('in trade-history-worker.js');
  const tradeHistoryWorker = new Worker('tradeHistory', async (job)=>{
    const blockId = job.data.block;
    console.log('received block: ' + blockId);
    
    // 1. Get valid escrows from trade history
    // 2. Get asset information from DB
    //    (job will fail and retry if asset info not in DB)
    // 3. Mix data
    // 4. Submit to trade history DB

    return blockDB.query('blocks/tradeHistory',
        {reduce: false, key: blockId})
        .then(async function(res) {
          const tradeHistoryRows = res.rows;
          if (tradeHistoryRows.length === 0) {
            return;
          }
          const accounts = tradeHistoryRows.map((row) => row.value.escrowAddr);
          return escrowDB.query('escrow/escrowAddr',
          {reduce: true,
            group: true, keys: accounts}).then(async function(res) {
            const innerRows = res.rows;
            if (innerRows.length === 0) {
              return;
            }
            const validAccountsSet = innerRows.map((row) => row.key)
                .reduce( (set, account) => set.add(account), new Set());

            const assetIds = tradeHistoryRows
              .map( (row) => row.value)
              .filter( (row) => validAccountsSet.has(row.escrowAddr) )
              .map( (row) => `${row.asaId}` );

            return assetDB.query('assets/assets',
              {reduce: false, keys: assetIds})
              .then(async function(res) {
                const assetToDecimals = res.rows.reduce( 
                  (obj, row) => {
                    obj[`assetId:${row.key}`] = row.value.asset.params.decimals
                    return obj;
                  }, {});
                
                const validHistoryRows = tradeHistoryRows
                      .filter(row => validAccountsSet.has(row.value.escrowAddr))
                      .map(row => row.value);
                
                let count = 0;
                validHistoryRows.forEach( (row) => {
                    const assetId = row.asaId;
                    row.assetDecimals = assetToDecimals[`assetId:${assetId}`];
                    row._id = `${row.block}:${count++}`;
                  }
                );
                console.log(assetToDecimals);
                return formattedHistoryDB.bulkDocs(validHistoryRows);
              });

          // res.rows.forEach( (row) => {
          //   const promise = 
          // });
          console.log({res});
        }).catch(function(e) {
          if (e.error === 'not_found') {
             // This should only happen when testing if you
             // don't start at contract genesis block
            console.error(e);
          } else {
            throw e;
          }
        });
      }).catch(function(e) {
        console.log(e);
        throw e;
      });
  }, {connection: queues.connection, concurrency: 50});

  tradeHistoryWorker.on('error', (err) => {
    console.error( {err} );
    throw err;
  });
};

