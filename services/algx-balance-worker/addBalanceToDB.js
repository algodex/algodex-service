
const withSchemaCheck = require('../../src/schema/with-db-schema-check');


const addBalanceToDB = async (algxBalanceDB, doc) => {
  try {
    await algxBalanceDB.put(withSchemaCheck('algx_balance', doc));
  } catch (err) {
    if (err.error === 'conflict') {
      console.error(err);
    } else {
      throw err;
    }
  }
};

module.exports = addBalanceToDB;
