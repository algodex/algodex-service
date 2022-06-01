// eslint-disable-next-line require-jsdoc
function sum() {

}
module.exports = function(keys, values, rereduce) {
  if (rereduce) {
    return {
      'o': values[0].o,
      'l': values.reduce(function(a, b) {
        return Math.min(a, b.l);
      }, Infinity),
      'h': values.reduce(function(a, b) {
        return Math.max(a, b.h);
      }, -Infinity),
      'c': values[values.length - 1].c,
      'sum': values.reduce(function(a, b) {
        return a + b.sum;
      }, 0),
      'count': values.reduce(function(a, b) {
        return a + b.count;
      }, 0),
      'sumsqr': values.reduce(function(a, b) {
        return a + b.sumsqr;
      }, 0),
    };
  } else {
    return {
      'o': values[0],
      'l': Math.min.apply(null, values),
      'h': Math.max.apply(null, values),
      'c': values[values.length - 1],
      'sum': sum(values),
      'count': values.length,
      'sumsqr': (function() {
        let sumsqr = 0;

        values.forEach(function(value) {
          sumsqr += value * value;
        });

        return sumsqr;
      })(),
    };
  }
};
