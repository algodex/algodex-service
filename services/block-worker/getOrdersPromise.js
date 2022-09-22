const verifyContracts = require('../../src/verify-contracts');
const {addMetadata} = require('./orderMetadata');

const getAssetsAndOrdersPromises =
  require('./getOrdersPromise/getAssetsAndOrdersPromises');
const removeEarliestRound = require('./getOrdersPromise/removeEarliestRound');

const getOrdersPromise = ({databases, queues, dirtyAccounts, blockData}) => {
  return databases.blocks.query('blocks/orders',
      {reduce: true, group: true, keys: dirtyAccounts})
      .then(async function(res) {
        console.log('here6a');

        // This below situation occurs during testing. Basically, the
        // known earliest round is after the current round because
        // the block where the order was initialized
        // wasn't yet in the database. So, filter any unknown orders

        res.rows = removeEarliestRound(res.rows, blockData.rnd);
        await addMetadata(blockData.rnd, 'order', res.rows.length > 0);
        console.log('here6b');

        if (!res.rows.length) {
          return;
        }
        console.log('here7');

        const accountsToVerify = res.rows;

        console.log('verifying ' + blockData.rnd,
            JSON.stringify(accountsToVerify));

        const validRows = await verifyContracts(res.rows,
            databases.verified_account);
        console.log('got valid rows: ' + JSON.stringify(validRows));

        const assetsAndOrdersPromises =
          getAssetsAndOrdersPromises({queues, validRows, blockData});
        return Promise.all(assetsAndOrdersPromises);
      }).catch(function(err) {
        if (err.error === 'not_found') {
          // //console.log('not found');
          throw err;
        } else {
          console.error('likely reducer error!!!', err);
          throw err;
        }
      });
};

module.exports = getOrdersPromise;
