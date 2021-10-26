import pino from 'pino';
// const {createWriteStream} = require('pino-sentry');

/**
 * Returns the Logger
 * @return {*}
 */
export default function getLogger() {
  const transport = pino.transport({
    target: 'pino-pretty',
    options: {destination: 1},
  });
  // const stream = createWriteStream({dsn: process.env.SENTRY_DSN});
  // return pino(opts, stream);
  // return pino(opts);
  return pino(transport);
};

