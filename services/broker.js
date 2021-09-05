const Redis  = require('ioredis');
const Queue = require('bullmq').Queue;
const {buy, sell, asset} = require('./faker');
const {setIntervalAsync} =require('set-interval-async/dynamic');
const queue = new Redis(6379, "queue");
const events  = new Redis(6379, "events");

const assets = new Queue('assets', { connection: queue });
const orders = new Queue('orders', { connection: queue });

// Fake chain data every 30 seconds
setIntervalAsync(async ()=>{
    console.log(`Publish ${asset.id} with ${buy.length} Buy(s) and ${sell.length} Sell(s)`)

    /**
     * WARNING!! This is not optimized. It pushes all data to the events bus which
     * gets subscribed to in the Client Service layer. The Client service will
     * send all events to it's own websocket subscribers which results in TONS of data.
     * It's just an example of how well the messages flow even in un-ideal situations
     */

    // Push to subscribers
    events.publish(`assets`, JSON.stringify(asset));
    events.publish(`orders`, JSON.stringify({buy, sell}));

    // Note: We may not need a Queue+Worker at all, just send to database
    async function addJobs(){
        await assets.add('assets', asset, {removeOnComplete: true});
        await orders.add('orders', buy.map((tx)=>{
            tx._id = 'order'
            tx.type = 'buy';
            return tx;
        }), {removeOnComplete: true});
        await orders.add('orders', sell.map((tx)=>{
            tx.type = 'sell';
            return tx;
        }), {removeOnComplete: true});
    }
    // Fire off Queue Jobs
    await addJobs();

}, 3000)