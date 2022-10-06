/*
 * Algodex Service
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// eslint-disable-next-line require-jsdoc
// @ts-nocheck

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
      // FIXME - figure out if we need this view.
      // sum below needs to be defined if so.
      // eslint-disable-next-line no-undef
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
