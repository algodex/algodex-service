
let indexerClient = null;

module.exports = () => {
  if (indexerClient !== null) {
    return indexerClient;
  }
  const algosdk = require('algosdk');
  const baseServer = process.env.ALGORAND_INDEXER_SERVER;

  if (!baseServer) {
    throw new Error('ALGORAND_INDEXER_SERVER is not set!');
  }
  const port = process.env.ALGORAND_INDEXER_TOKEN || '';

  const token = {
    'X-API-key': process.env.ALGORAND_INDEXER_TOKEN || '',
    'X-Indexer-API-Token': process.env.ALGORAND_INDEXER_TOKEN || '',
  };

  indexerClient = new algosdk.Indexer(token, baseServer, port);
  return indexerClient;
};