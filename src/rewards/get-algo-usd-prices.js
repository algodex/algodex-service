
const fs = require("fs");
const { parse } = require("csv-parse");
const path = require('node:path');

const getAlgoUsdPrices = async () => {
  const filePath = path.join(__dirname, "ALGO-USD.csv");
  const promise = new Promise((resolve, reject) => {
    rows = [];
    fs.createReadStream(filePath)
        .pipe(parse({ delimiter: ",", from_line: 2 }))
        .on("data", function (row) {
          rows.push(row);
        })
        .on("end", function () {
          const results = rows.map(row => {
            return {date: row[0], midPrice:
              (parseFloat(row[2]) + parseFloat(row[3])) / 2};
          });
          resolve(results);
        })
        .on("error", function (error) {
          console.log(error.message);
          reject();
        });
  });
  return promise;
}

module.exports = getAlgoUsdPrices;