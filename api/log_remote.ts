import { getDatabase } from "./util";
const tableify = require('tableify');

// curl -d '{"message":"a log message", "severity":"error", "unixTime":132133}' -H "Content-Type: application/json" -X POST http://localhost:3006/debug/log/post
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
  saveRewardsReqData.ipAddress = ipAddress;
  await db.post(saveRewardsReqData);
  res.sendStatus(200);
};

export const serveGetLogs = async (req, res) => {
  console.log('Got logs:', req.body);
  const db = getDatabase('logging');
  const ipAddress = req.query.ipAddress;

  const data = await db.query('logging/ipAddress', {
    key: ipAddress,
  });
  data.rows.sort((a, b) => (a.unixTime > b.unixTime) ? 1 : -1);

  const html = tableify(data.rows.map(entry => {
    const message = entry.value.message;
    delete entry.value.message;
    const date = new Date(entry.value.unixTime).toUTCString();
    delete entry.value.unixTime;
    entry.value.date = date;
    entry.value.message = message; // shift to end
    return entry.value;
  }));
  res.end(html);

};