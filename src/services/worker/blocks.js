import {getDatabase, getLogger} from '../../index.js';
const log = getLogger();

/**
 * Process a Block
 * @param {object} data Block Data
 * @return {Promise<*>}
 */
export default async function work({data}) {
  const db = getDatabase();
  const _id = db.generateDocId('block', data.rnd);

  log.info({
    msg: `📢 received block ${data.rnd}`,
  });

  const res = await db.save(_id, data);
  log.info({
    msg: `📥 saved block ${_id}`,
  });
  return res;
};

