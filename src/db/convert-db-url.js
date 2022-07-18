
const convertURL = dbUrl => {
  const prefix = 'integration_test__';
  const isIntegrationTest = process.env.INTEGRATION_TEST_MODE &&
    process.env.INTEGRATION_TEST_MODE != 0;

  if (dbUrl.includes(prefix)) {
    return dbUrl;
  }
  if (isIntegrationTest) {
    const regex = /(^.*\/)([^\/]+)/;
    const matches = dbUrl.match(regex);
    // console.log(match[1]); // abc
    const matchesArr = Array.from(matches);
    return matchesArr[1] + prefix+matchesArr[2];
    // return dbUrl.replaceAll(matchesArr[1], '__test_'+matchesArr[1]);
  }
  return dbUrl;
};

module.exports = convertURL;
