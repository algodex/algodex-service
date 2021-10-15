const SwaggerClient = require('swagger-client');
const {setIntervalAsync} = require('set-interval-async/dynamic');

module.exports = ({connections, queues}) => {
    console.log(`Broker Publisher working with ${Object.keys(queues).length} Queues`)
    // TODO: Move to Algod and remove hard coding
    const explorer = new SwaggerClient('https://testnet.algoexplorerapi.io/v2/swagger.json');

    /**
     * Holds Status from AlgoExplorer
     * @type {{}}
     */
    let round = {}

// Fake chain data every 30 seconds
    setIntervalAsync(async () => {
        explorer.then(
            async client => {
                let {obj} = await client.apis.node.GetStatus();
                console.log(obj['last-round'], round['last-round']);
                if (round['last-round'] === obj['last-round']) {
                    console.log('Waiting....')
                } else {
                    console.log('New block found');
                    // Publish Block Event
                    let blockres = await client.apis.block.GetBlock({round: obj['last-round']});
                    await queues.blocks.add('blocks', blockres.obj.block, {removeOnComplete: true});
                    // await redis_events.publish(`block`, JSON.stringify(await client.apis.block.GetBlock(round['last-round'])));
                    console.log('New block sent');
                    round = obj;
                }
            },
            reason => console.error('failed to load the spec: ' + reason)
        )

    }, 1000)
}