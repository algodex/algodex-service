import {useDatabase, useLogger} from '@algodex/common';
const log = useLogger();

/**
 * Process a Block
 * @param {object} data Block Data
 * @return {Promise<*>}
 */
export default async function processBlocks({data}) {
  const db = useDatabase();
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

