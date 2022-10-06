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

const removeEarliestRound = require('./removeEarliestRound');
it('removes round keys and invalid data', () => {
  const vals = [
    {value: {
      round: 417,
      earliestRound: 410,
      otherData: 'some data',
    }},
    {value: {
      round: 417,
      earliestRound: 415,
      otherData: 'some data2',
    }},
    {value: {
      round: 417,
      earliestRound: 570,
      otherData: 'some data3',
    }},
  ];
  const afterRemoval = removeEarliestRound(vals, 417);
  expect(afterRemoval).toEqual([
    {value: {
      otherData: 'some data',
    }},
    {value: {
      otherData: 'some data2',
    }},

  ]);
});

