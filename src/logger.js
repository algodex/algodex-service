const pino = require('pino');
// const {createWriteStream} = require('pino-sentry');


module.exports = function(opts) {
  // const stream = createWriteStream({dsn: process.env.SENTRY_DSN});
  // return pino(opts, stream);
  return pino(opts);
};

