// https://github.com/OptimalBits/bull/issues/962#issuecomment-555669208
module.exports = jest.mock('ioredis', () => {
  const Redis = require('ioredis-mock');
  if (typeof Redis === 'object') {
    // the first mock is an ioredis shim because ioredis-mock depends on it
    // https://github.com/stipsan/ioredis-mock/blob/master/src/index.js#L101-L111
    Redis.Command = {_transformer: {argument: {}, reply: {}}};
    return {
      Command: {_transformer: {argument: {}, reply: {}}},
    };
  }
  // second mock for our code
  return function(...args) {
    const instance = new Redis(args);
    instance.options = {};
    // semver in redis client connection requires minimum version 5.0.0
    // https://github.com/taskforcesh/bullmq/blob/da8cdb42827c22fea12b9c2f4c0c80fbad786b98/src/classes/redis-connection.ts#L9
    instance.info = async () => 'redis_version:5.0.0';
    instance.client = (clientCommandName, ...args) => {
      if (!instance.clientProps) {
        instance.clientProps = {};
      }

      switch (clientCommandName) {
        case 'setname': {
          const [name] = args;
          instance.clientProps.name = name;
          return 'OK';
        }
        case 'getname':
          return instance.clientProps.name;
        default:
          throw new Error('This implementation of the client ' +
            'command does not support ' + clientCommandName);
      }
    };

    return instance;
  };
});
