import { getDatabase } from "./util";
const tableify = require('tableify');

const withSchemaCheck = require('../src/schema/with-db-schema-check');

// curl -d '{"message":"a log message", "severity":"error", "unixTime":132133, "environment":"development", "href":"http://my-href"}' -H "Content-Type: application/json" -X POST http://localhost:3006/debug/log/post
export const logRemote = async (req, res) => {
  console.log('Got body:', req.body);
  const db = getDatabase('logging');

  const saveRewardsReqData = <LogMessage>(req.body);
  let ipAddress;
  if (req.headers['x-forwarded-for'] !== '::1') {
    ipAddress = req.headers['x-forwarded-for']
  } else {
    const regex = /^::ffff:/i;
    ipAddress = req.socket.remoteAddress.replace(regex, '');
  }
  saveRewardsReqData.ipAddress = ipAddress || "UNKNOWN";
  if (typeof saveRewardsReqData.message !== 'string') {
    saveRewardsReqData.message = JSON.stringify(saveRewardsReqData.message, null, 2);
  }
  await db.post(withSchemaCheck('logging', saveRewardsReqData));
  res.sendStatus(200);
};

export const serveGetLogs = async (req, res) => {
  console.log('Got logs:', req.body);
  const db = getDatabase('logging');
  const ipAddress = req.query.ipAddress;

  const data = await db.query('logging/ipAddress', {
    startkey: [ipAddress, 9e99],
    endkey: [ipAddress, 0],
    descending: true,
    limit: 1000
  });
  data.rows.sort((a, b) => (a.unixTime > b.unixTime) ? -1 : 1);
  const style = `<style>
  table, tr, td,th {
    border: 1px solid #BBB;
  
  }
  
  td {
    font-family: monospace;
      white-space: pre;
  }
  </style>`;
  const html = tableify(data.rows.map(entry => {
    const message = entry.value.message;
    delete entry.value.message;
    const date = new Date(entry.value.unixTime).toUTCString();
    delete entry.value.unixTime;
    entry.value.date = date;
    if (typeof message !== 'string') {
      entry.value.message = JSON.stringify(message, null, 2); // shift to end
    } else {
      entry.value.message = message;
    }
    return entry.value;
  }));
  res.end(style+html);

};