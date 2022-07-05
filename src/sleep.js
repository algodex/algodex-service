// eslint-disable-next-line require-jsdoc
function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = sleep;
