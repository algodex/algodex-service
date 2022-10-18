/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { getDatabase } from "./util";
const tableify = require('tableify');

const withSchemaCheck = require('../src/schema/with-db-schema-check');

// curl -d '{"message":"a log message", "severity":"error", "unixTime":132133, "environment":"development", "href":"http://my-href"}' -H "Content-Type: application/json" -X POST http://localhost:3006/debug/log/post
export const logRemote = async (req, res) => {
  return;
  /*
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
  saveRewardsReqData.message = saveRewardsReqData.message.slice(0, 10000);
  await db.post(withSchemaCheck('logging', saveRewardsReqData));
  res.sendStatus(200);
  */
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
  res.send(style+html);

};