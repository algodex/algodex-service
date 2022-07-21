const fs = require('fs');
const path = require('path');

const loadJson = filename => {
  const data =
    // eslint-disable-next-line no-undef
    fs.readFileSync(path.resolve(__dirname, filename), 'utf8');
  return JSON.parse(data);
};

module.exports = loadJson;
