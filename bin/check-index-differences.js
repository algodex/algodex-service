/* Usage
 *
 * ./check-index-differences [endpoint1] [endpoint2]
 */
const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));

// const databases = require('../src/db/db-config.js')();
const getDatabases = require('../src/db/get-databases');
const databases = getDatabases();
const databaseConfigs = require('../src/db/db-config.js')();
const fs = require('fs');

const finder = require('findit')(__dirname +'/../');

const checkIndexDifferences = async (endpoint1, endpoint2) => {
  const dbNames = databaseConfigs.map(config => config.dbName);

  console.log(dbNames);

  for (let i = 0; i < dbNames.length; i++) {
    const config = databaseConfigs[i];
    const dbName = dbNames[i];
    const url = endpoint1 + '/' + dbName;
    const initializedDB =new PouchDB(url);
    if (!config.design?._id) {
      continue;
    }
    const designId = config.design._id;
    try {
      const page = await initializedDB.get(designId);
      const regex = /\s+/ig;
      const regex2 = /function\(/ig;

      const hostedDBViews = JSON.stringify(page.views)
          .replaceAll(regex, ' ').replaceAll(regex2, 'function (')
          .replaceAll('\\n', ' ').replaceAll('\\r', ' ');
      const configViews = JSON.stringify(config.design.views)
          .replaceAll(regex, ' ').replaceAll(regex2, 'function (')
          .replaceAll('\\n', ' ').replaceAll('\\r', ' ');
      if (hostedDBViews !== configViews) {
        console.log('========================');
        console.log('View mismatch: [' + dbName + ']');
        console.log('------------On Disk-----------');
        console.log(hostedDBViews);
        console.log('------------Config------------');
        console.log(configViews);
        console.log('========================');
      }
    } catch (e) {
      console.log('Page does not exist! ' + JSON.stringify(e));
    }
  }
};

const args = process.argv.slice(2);
const endpoint1 = args[0];
const endpoint2 = args[1];

const allViews = [];

for (let i = 0; i < databaseConfigs.length; i++) {
  const config = databaseConfigs[i];
  // console.log({config});
  if (!config?.design?.views) {
    continue;
  }

  const dbName = config.dbName;
  const views = Object.keys(config.design.views);

  const fullViews = views.map(view => dbName + '/' + view);
  allViews.push(...fullViews);
}

const viewSet = new Set(allViews);

// // This listens for files found
finder.on('file', function(file) {
  const extension = file.split('.').pop();
  if (file.includes('spec.') || file.includes('node_modules') ||
   file.includes('/built') || file.includes('__tests__')) {
    return;
  }
  if (extension === 'js' || extension === 'ts') {
    const allText = fs.readFileSync(file, {encoding: 'utf8', flag: 'r'}).replaceAll('\n', '');
    const regex = /query\('([^']*)'/gi;
    let result;
    while (result = regex.exec(allText)) {
      if (!viewSet.has(result[1])) {
        console.log(result[1] + ' is not in config!');
      }
    }
  }
});
console.log('---- CHECKING VIEW DIFFs ----');
checkIndexDifferences(endpoint1, endpoint2);
