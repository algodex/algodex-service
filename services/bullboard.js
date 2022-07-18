require('dotenv').config();
const express = require('express');
// const QueueMQ = require('bullmq');
const {createBullBoard} = require('@bull-board/api');
// const {BullAdapter} = require('@bull-board/api/bullAdapter');
const {BullMQAdapter} = require('@bull-board/api/bullMQAdapter');
const {ExpressAdapter} = require('@bull-board/express');
// Configure Queues
const getQueues = require('../src/queues');
const args = require('minimist')(process.argv.slice(2));

if (args.integrationTest) {
  process.env.INTEGRATION_TEST_MODE = 1;
}
const queues = getQueues();

const serverAdapter = new ExpressAdapter();
// commented due to linting error , because these are not used
createBullBoard(
    {
      queues: [
        new BullMQAdapter(queues.blocks),
        new BullMQAdapter(queues.orders),
        new BullMQAdapter(queues.assets),
        new BullMQAdapter(queues.tradeHistory),
        new BullMQAdapter(queues.formattedEscrows),
        new BullMQAdapter(queues.ownerBalance),
      ],
      serverAdapter: serverAdapter,
    },
);

const app = express();

serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', serverAdapter.getRouter());

// other configurations of your server

app.listen(3000, () => {
  console.log('Running on 3000...');
  console.log('For the UI, open http://localhost:3000/admin/queues');
  console.log('Make sure Redis is running on port 6379 by default');
});
