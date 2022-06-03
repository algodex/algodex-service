const algosdk = require('algosdk');
let client;

module.exports = function getAlgod() {
  if (typeof process.env.ALGORAND_ALGOD_SERVER === 'undefined') {
    throw new Error('Invalid Algod server!');
  }
  if (typeof client === 'undefined') {
    client = new algosdk.Algodv2(
        process.env.ALGORAND_TOKEN,
        process.env.ALGORAND_ALGOD_SERVER,
        process.env.ALGORAND_ALGOD_PORT,
    );
  }
  return client;
};
