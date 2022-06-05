const bullmq = require('bullmq');
const Worker = bullmq.Worker;

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

          const data = {'adasdas': 'bbbbb'};
          console.log('here55');
          db.query('dex/orders').then(function(res) {
            // got the query results
            console.log('asdasdas');
            console.log ({res});
          }).catch(function (err) {
            console.log({err});
          });
          console.log('here57');
          escrowDB.post({_id: `${job.data.rnd}`, type: 'block', data: data})
              .then(function(response) {
                console.debug({
                  msg: `Block stored`,
                  ...response,
                });
              }).catch(function(err) {
                console.error(err);
              });
        }).catch(function(err) {
          console.error(err);
        });
    
  }, {connection: queues.connection, concurrency: 50});

  orders.on('error', (err) => {
    console.error(err);
  });
};

