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

const os = require('os');
const {InvalidParameter} = require('../Errors');
const {
  createConsecutiveArray,
  createConsecutiveObject,
  cpuChunkArray,
} = require('../util');

test('create consecutive items in an array', async () => {
  expect(()=>{
    createConsecutiveArray(5, 4);
  }).toThrowError(InvalidParameter);

  const arry = createConsecutiveArray(10, 15);
  expect(arry.length).toEqual(5);
});


test('create consecutive keys of an object', ()=>{
  expect(()=>{
    createConsecutiveObject(5, 4);
  }).toThrowError(InvalidParameter);

  const obj = createConsecutiveObject(10, 15);
  expect(Object.keys(obj).length).toEqual(5);
});

test('chunk array by CPU cores', ()=>{
  expect(()=>{
    cpuChunkArray('fail');
  }).toThrowError(InvalidParameter);

  const arry = cpuChunkArray(createConsecutiveArray(10, 150));
  // FIXME, could be slightly optimized
  expect([os.cpus().length + 1, os.cpus().length]).toContain(arry.length);
});
