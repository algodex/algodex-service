import {getDatabase, getLogger} from '../../src/index.js';
const log = getLogger();

/**
 * Process a Block
 * @param {object} data Block Data
 * @return {Promise<*>}
 */
export default async function work({data}) {
// module.exports = async ({data}) =>{
  log.info({
    msg: 'Received block',
    round: data.rnd,
  });
  const db = getDatabase();
  return db.save(db.generateDocId('block', data.rnd), data);
};

