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

/* eslint-disable require-jsdoc */

module.exports = {
  post: jest.fn(() => new Promise(resolve => {
    resolve('posted');
  })),
  get: jest.fn(() => new Promise(resolve => {
    throw {'error': 'not_found'};
  })),
  query: jest.fn(() => new Promise(resolve => {
    resolve({rows: []});
  })),
};

