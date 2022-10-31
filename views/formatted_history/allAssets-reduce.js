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


// @ts-nocheck

module.exports = function(keys, values, rereduce) {
  const calculateLastValue = values => {
    const lastValue = values.reduce( (finalValue, value) => {
      if (value.unixTime > finalValue.unixTime) {
        return value;
      }
      return finalValue;
    }, values[0]);

    return lastValue;
  };

  const calculateYesterdayValue = values => {
    // const today = 1663255814; // for debugging
    const today = Date.now() / 1000;

    values.sort((a, b) => b.unixTime - a.unixTime);
    const yesterdayValue = values.find( value => value.unixTime <= today - 86400);
    return yesterdayValue;
  };

  const calculateDailyChangePct = (lastValue, yesterdayValue) => {
    // return -1;
    if (!yesterdayValue || !lastValue) {
      return 0;
    }
    const res = (lastValue - yesterdayValue) / yesterdayValue * 100;
    return res;
  };


  let result;

  if (rereduce) {
    const lastValues = values.map(value => value.lastValue);
    const yesterdayValues = values.map(value => value.yesterdayValue);
    result = {
      lastValue: calculateLastValue(lastValues),
      yesterdayValue: calculateYesterdayValue(yesterdayValues),
    };
  } else {
    result = {
      lastValue: calculateLastValue(values),
      yesterdayValue: calculateYesterdayValue(values),
    };
  }

  let latestPrice = 0;
  let yesterdayPrice = 0;

  if (result.lastValue && result.lastValue.price) {
    latestPrice = result.lastValue.price;
  }
  if (result.yesterdayValue && result.yesterdayValue.price) {
    yesterdayPrice = result.yesterdayValue.price;
  }

  result.dailyChange = calculateDailyChangePct(latestPrice, yesterdayPrice);
  return result;
};
