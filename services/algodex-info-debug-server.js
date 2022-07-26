const express = require('express');
const getDatabases = require('../src/db/get-databases');

const app = express();
const port = 3001;

const databases = getDatabases();
const wrapRows = rowsHtml => {
  return '<html><body><table border=1>' + rowsHtml + '</table></body></html>';
};
app.get('/', async (req, res) => {
  const formattedEscrowDB = databases.formatted_escrow;
  try {
    const escrowData =
      await formattedEscrowDB.query('formatted_escrow/orders',
          {reduce: false, key: ['ownerAddr', 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI']} );
    const tableHeaders = Object.keys(escrowData.rows[0].value).reduce((html, key) => {
      return html + '<th>' + key + '</th>';
    }, '');

    const rowsHtml = escrowData.rows.reduce( (allRows, row) => {
      return allRows + '<tr>' +
      Object.keys(row.value).reduce((html, key) => {
        return html + '<td>' + row.value[key]+ '</td>';
      }, '') +
      '</tr>';
    }, '<tr>' + tableHeaders + '</tr>');
    res.send(wrapRows(rowsHtml));
  } catch (e) {
    console.log(e);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

