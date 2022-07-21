const dotenv = require('dotenv');
const fs = require('fs');

const getFile = async file => {
  return await new Promise( resolve => {
    fs.readFile(file, 'utf8', (err, data) => {
      console.log(data);
      resolve(data);
    });
  });
};

const getTestnetConfig = async () => {
  const envContents = await getFile('./.testnet.localhost.env');
  const buf = Buffer.from(envContents);
  const config = dotenv.parse(buf);
  return config;
};


const initTestnetEnv = async () => {
  const config = await getTestnetConfig();
  Object.keys(config).forEach(configKey => {
    process.env[configKey] = config[configKey];
  });
};

module.exports = {initTestnetEnv, getTestnetConfig};
