const SwaggerClient = require('swagger-client');

let client, indexer;
const ALGODEX_EXPLORER = process.env['ALGODEX_EXPLORER'] || 'https://testnet.algoexplorerapi.io';

async function getAPI(){
    if(typeof client === 'undefined'){
        client = await new SwaggerClient(`${ALGODEX_EXPLORER}/v2/swagger.json`);
        client.spec.host='testnet.algoexplorerapi.io';
    }
    return client.apis;
}

async function getIndexAPI(){
    if(typeof indexer === 'undefined'){
        indexer = await new SwaggerClient(`${ALGODEX_EXPLORER}/idx2/swagger.json`);
        indexer.spec.host='testnet.algoexplorerapi.io';
    }
    return indexer.apis;
}

async function getGenesisBlock(id){
    let api = await getIndexAPI();
    let {obj} = await api.lookup.lookupApplicationsByID({"application-id": id});
    return obj.application['created-at-round'];
}

async function getHealthCheck(){
    let api = await getIndexAPI();
    let {obj} = await api.common.makeHealthCheck();
    return obj;
}

async function getCurrentBlock(){
    let health = await getHealthCheck();
    let {round} = health;
    return round;
}
async function getBlock({round}){
    let api = await getAPI();
    let {obj} = await api.block.GetBlock({round});
    let {block} = obj;
    return block;
}

async function waitForBlock({round}){
    let api = await getAPI();
    let {obj} = await api.block.WaitForBlock({round});
    return obj;
}
async function getAppsBlockStart(apps){
    for(const app of apps){
        app.genesis = await getGenesisBlock(app.id);
    }

    return Math.min(...apps.map(app=>app.genesis));
}

async function getAppsBlockRange(apps){
    return {
        start: await getAppsBlockStart(apps),
        current: await getCurrentBlock(),
    };
}

module.exports = {
    getAppsBlockRange,
    getBlock,
    waitForBlock
}