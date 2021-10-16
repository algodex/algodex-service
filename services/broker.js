const {getBlock, waitForBlock} = require('../src/explorer');

module.exports = ({queues, events}) => {
    console.log(`Broker Publisher working with ${Object.keys(queues).length} Queues`)

    /**
     * Store the result of WaitForBlocks
     *
     * Use genesis block as a flag for "fresh init"
     * @type {{"last-round": number}}
     */
    let round = {
        'last-round': 1
    }

    /**
     * Run the Broker
     * @returns {Promise<void>}
     */
    async function run(){
        // Wait for the next block
        let obj = await waitForBlock({
            round: round['last-round'],
        });

        // Just in case the wait fails, skip if we are on the same block
        if (round['last-round'] === obj['last-round']) {
            console.log('Waiting....')
        }

        // Submit the next round to the Queue and Publish event
        else {
            console.log(`Last Round: ${round['last-round']}, New Algorand Round: ${obj['last-round']}`);

            let roundNumber = round['last-round'];
            if(round['last-round'] !== 1){
                // Bump the last round, after WaitForBlock is complete
                roundNumber++;
            } else {
                // Use the WaitForBlock round number if we don't have one stored
                roundNumber = obj['last-round'];
            }
            let block = await getBlock({round: roundNumber });
            await queues.blocks.add('blocks', block, {removeOnComplete: true});
            await events.publish(`blocks`, JSON.stringify(block.rnd));
            console.log(`Block ${roundNumber}: Published and Queued`);

            // Update last round cache
            round = obj;

            //Rerun forever
            run();
        }
    }

    // Kick off the wrapper
    run();
}