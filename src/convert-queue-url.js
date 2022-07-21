const convertQueueURL = name => {
  if (name.includes('integration_test__')) {
    return name;
  }

  if (process.env.INTEGRATION_TEST_MODE &&
    process.env.INTEGRATION_TEST_MODE != '0') {
    return 'integration_test__' + name;
  }
  return name;
};

module.exports = convertQueueURL;
