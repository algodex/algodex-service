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

/* eslint-disable camelcase */
/* eslint-disable max-len */
const express = require('express');
const getDatabases = require('../src/db/get-databases');

const app = express();
const port = 3001;

const databases = getDatabases();

/**
 *
 * https://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
 * @param {number} unix_timestamp
 * @return {string}
 */
function timeConverter(unix_timestamp) {
  const a = new Date(unix_timestamp * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = a.getFullYear();
  const month = months[a.getMonth()];
  const date = a.getDate();
  const hour = a.getHours();
  const min = a.getMinutes();
  const sec = a.getSeconds();
  const time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
  return time;
}


const wrapRows = rowsHtml => {
  return '<html><body><a href="/">Return</a><p><table border=1>' +
     rowsHtml + '</table></body></html>';
};
const printRows = rows => {
  if (!rows[0]) {
    return '<html><body>NA</body></html>';
  }
  const tableHeaders = Object.keys(rows[0]).reduce((html, key) => {
    return html + '<th>' + key + '</th>';
  }, '');

  const rowsHtml = rows.reduce( (allRows, row) => {
    return allRows + '<tr>' +
    Object.keys(row).reduce((html, key) => {
      return html + '<td>' + row[key]+ '</td>';
    }, '') +
    '</tr>';
  }, '<tr>' + tableHeaders + '</tr>');
  return wrapRows(rowsHtml);
};
const transformRows = rows => {
  const hideKeys = ['ownerAddress', 'escrowAddress'];
  rows.sort((a, b) => a.unix_time > b.unix_time ? -1 : 1);

  const newRows = rows.map(row => {
    const newRow = {...row};
    hideKeys.forEach(key => delete newRow[key]);
    const timeFormatted = timeConverter(row['unix_time']);
    delete newRow.unix_time;
    newRow.amount =
      newRow.isAlgoBuyEscrow ? newRow.algoAmount : newRow.asaAmount;
    delete newRow.asaAmount;
    delete newRow.algoAmount;

    newRow.datetime = `<a target="_null" href="https://testnet.algoexplorer.io/address/${row.escrowAddress}">${timeFormatted}</a>`;
    return newRow;
  });
  return newRows;
};

const transformHistoryRows = rows => {
  const hideKeys = ['ownerAddress', 'assetSellerAddr',
    'assetBuyerAddr', 'groupId', 'escrowAddr'];
  rows.sort((a, b) => a.unixTime > b.unixTime ? -1 : 1);

  const newRows = rows.map(row => {
    const newRow = {...row};
    hideKeys.forEach(key => delete newRow[key]);
    const timeFormatted = timeConverter(row['unixTime']);
    delete newRow.unix_time;

    newRow.datetime = `<a target="_null" href="https://testnet.algoexplorer.io/address/${row.escrowAddr}">${timeFormatted}</a>`;
    return newRow;
  });
  return newRows;
};

const getInputForm = () => {
  return `
  <html>
  <body>
  <div style='margin: 20px; padding:20px; background-color:#EEE'>
  <form action="">
  You are on ${process.env.ALGORAND_NETWORK}<p>
  Enter Wallet Address: <input type="text" name="ownerAddr" />
  <input type="submit" />
  </form>
  </div>
  </body>
  </html>
  `;
};

const getMenu = () => {
  return `
    <html>
    <body>
    <div style='margin: 20px; padding:20px; background-color:#EEE'>
    <a href='/orders'>Orders</a><p>
    <a href='/history'>History</a></p>
    </div>
    </body>
    </html>
  `;
};

app.get('/', async (req, res) => {
  res.send(getMenu());
  return;
});

app.get('/orders', async (req, res) => {
  const formattedEscrowDB = databases.formatted_escrow;
  if (!req.query.ownerAddr) {
    res.send(getInputForm());
    return;
  }
  const ownerAddr = req.query.ownerAddr;

  try {
    const escrowData =
      await formattedEscrowDB.query('formatted_escrow/orders',
          {reduce: false, key: ['ownerAddr', ownerAddr]} );

    const rows = escrowData.rows.map(row => row.value);
    const transformedRows = transformRows(rows);
    res.send(printRows(transformedRows));
  } catch (e) {
    console.log(e);
  }
});

app.get('/history', async (req, res) => {
  const formattedHistoryDB = databases.formatted_history;
  if (!req.query.ownerAddr) {
    res.send(getInputForm());
    return;
  }
  const ownerAddr = req.query.ownerAddr;

  try {
    const escrowData =
      await formattedHistoryDB.query('formatted_history/activityView',
          {reduce: false, key: ownerAddr} );

    const rows = escrowData.rows.map(row => row.value);
    const transformedRows = transformHistoryRows(rows);
    res.send(printRows(transformedRows));
  } catch (e) {
    console.log(e);
  }
});

app.listen(port, () => {
  console.log(`http://localhost:${port}/`);
});

