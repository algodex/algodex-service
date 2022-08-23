module.exports = function(keys, values, rereduce) {
  return values.reduce( (retval, val) => {
    if (val.round > retval.round) {
      retval = val;
    }
    return retval;
  });
};

