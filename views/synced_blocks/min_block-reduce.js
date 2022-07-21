// @ts-nocheck

module.exports = function(keys, values, rereduce) {
  return values.reduce( (min, value) => {
    if (min === -1) {
      return value;
    }
    return Math.min(min, value);
  }, -1);
};
