const throttle = require('lodash.throttle');
const axios = require('axios').default;
const sleep = require('../src/sleep');

const waitForViewBuildingSimple = async () => {
  await waitForViewBuilding(null, true, 100);
};

const waitForViewBuilding = async (blocksDB, skipCheckAgain = false, pauseMS=500) => {
  const couchUrl = process.env.COUCHDB_BASE_URL;
  let loop = true;

  const waitLogThrottle = throttle(() => {
    console.log('Waiting for DB indexes to rebuild...');
  }, 5000);

  while (loop) {
    await axios.get(couchUrl + '/_active_tasks')
        .then(async function(response) {
          // handle success
          if (response.data.length === 0 ||
              response.data.filter(item =>
                // Ignore these types of DB operations since data
                // can still be added and views still work
                item.type !== 'view_compaction' &&
                item.type !== 'database_compaction').length === 0) {
            if (!skipCheckAgain) {
              // Try to get max block
              await blocksDB.query('blocks/maxBlock',
                  {reduce: true, group: true});
              // Wait again
              await waitForViewBuilding(blocksDB, true);
            }
            loop = false;
            return;
          } else {
            waitLogThrottle();
          }
        }).catch(function(error) {
          console.error('Unexpected error when fetching active tasks! ',
              error);
        });
    if (!loop) {
      break;
    }
    await sleep(pauseMS);
  }
};

module.exports = {waitForViewBuilding, waitForViewBuildingSimple};

