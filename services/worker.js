const bullmq = require('bullmq');
const Worker = bullmq.Worker;

module.exports = ({queues, db}) =>{
  // Lighten the load on the broker and do batch processing
  const orders = new Worker('blocks', async (job)=>{
    console.debug({
      msg: 'Received block',
      round: job.data.rnd,
    });
    // Save to database
    return db.post({_id: `${job.data.rnd}`, type: 'block', ...job.data})
        .then(function(response) {
          console.debug({
            msg: `Block stored`,
            ...response,
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

