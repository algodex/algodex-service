const addBalanceToDB = require('./addBalanceToDB');
const checkInDB = require('./checkInDB');

const getCurrentBalanceMap =
  require('./getCurrentBalanceMap');
const getChangedAccountValues =
  require('./getChangedAccountValues');
const getDirtyAccounts = require('../../src/get-dirty-accounts');
// eslint-disable-next-line max-len
const withQueueSchemaCheck = require('../../src/schema/with-queue-schema-check');

const handleAlgxBalanceJob = async (job, algxBalanceDB) => {
  const block = job.data;
  const round = job.data.rnd;
  console.log(`Got balance job! Round: ${round}`);
  withQueueSchemaCheck('algxBalance', job.data);
  const isInDB = await checkInDB(algxBalanceDB, round);
  if (isInDB) {
  // Nothing to do
    return;
  }
  const dirtyAccounts = getDirtyAccounts(block);
  const ownerToLastBalance =
  await getCurrentBalanceMap(algxBalanceDB, dirtyAccounts);
  const changedAccountData =
  getChangedAccountValues(ownerToLastBalance, block);

  if (changedAccountData.length > 0) {
    console.log('has changes!');
  }
  await addBalanceToDB(algxBalanceDB, {
    _id: round+'',
    changes: changedAccountData,
  });
};

module.exports = handleAlgxBalanceJob;
