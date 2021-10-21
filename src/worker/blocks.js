const getDatabase = require('../db');
const getLogger = require('../logger');
const log = getLogger();

module.exports = async ({data}) =>{
  log.info({
    msg: 'Received block',
    round: data.rnd,
  });
  const db = getDatabase();
  return db.save(db.generateDocId('block', data.rnd), data);
};

