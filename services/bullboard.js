/*
 * Algodex Service
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
  process.env.INTEGRATION_TEST_MODE = '1';
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
        new BullMQAdapter(queues.algxBalance),
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
