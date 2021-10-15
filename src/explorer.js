const SwaggerClient = require('swagger-client');

let client, indexer;

async function getAPI(){
    if(typeof client === 'undefined'){
        client = await new SwaggerClient('https://testnet.algoexplorerapi.io/v2/swagger.json');
        client.spec.host='testnet.algoexplorerapi.io';
    }
    return client.apis;
}

async function getIndexAPI(){
    if(typeof indexer === 'undefined'){
        indexer = await new SwaggerClient('https://testnet.algoexplorerapi.io/idx2/swagger.json');
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
async function getBlock(round){
    let api = await getAPI();
    let {obj} = await api.block.GetBlock({round});
    let {block} = obj;
    return block;
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
    getBlock
}