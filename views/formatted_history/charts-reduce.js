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
  const getOpen = vals => {
    return vals.reduce((retVal, val) => {
      if (val.unixTime < retVal.unixTime) {
        retVal = val;
      }
      return {unixTime: retVal.unixTime, formattedPrice: retVal.formattedPrice};
    }, vals[0]);
  };
  const getClose = vals => {
    return vals.reduce((retVal, val) => {
      if (val.unixTime > retVal.unixTime) {
        retVal = val;
      }
      return {unixTime: retVal.unixTime, formattedPrice: retVal.formattedPrice};
    }, vals[0]);
  };
  const getHigh = vals => {
    return vals.reduce((retVal, val) => {
      if (val.formattedPrice > retVal.formattedPrice) {
        retVal = val;
      }
      return {unixTime: retVal.unixTime, formattedPrice: retVal.formattedPrice};
    }, vals[0]);
  };
  const getLow = vals => {
    return vals.reduce((retVal, val) => {
      if (val.formattedPrice < retVal.formattedPrice) {
        retVal = val;
      }
      return {unixTime: retVal.unixTime, formattedPrice: retVal.formattedPrice};
    }, vals[0]);
  };

  if (!rereduce) {
    return {
      'o': getOpen(values),
      'l': getLow(values),
      'h': getHigh(values),
      'c': getClose(values),
    };
  } else {
    return {
      'o': getOpen(values.map(v => v.o)),
      'l': getLow(values.map(v => v.l)),
      'h': getHigh(values.map(v => v.h)),
      'c': getClose(values.map(v => v.c)),
    };
  }
};
