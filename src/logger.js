import pino from 'pino';
// const pino = require('pino');
// const {createWriteStream} = require('pino-sentry');

/**
 * Returns the Logger
 * @param {object} opts
 * @return {P.Logger}
 */
export default function getLogger(opts) {
// module.exports = function(opts) {
  // const stream = createWriteStream({dsn: process.env.SENTRY_DSN});
  // return pino(opts, stream);
  return pino(opts);
};

