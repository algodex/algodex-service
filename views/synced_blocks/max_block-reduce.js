module.exports = function(keys, values, rereduce) {
  return values.reduce( (max, value) => {
    return Math.max(max, value);
  }, 0);
};
