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

const {InvalidConfiguration} = require('../Errors');
const RedisMock = require('ioredis-mock');
require('../__mocks__/Redis');

test('event stream can be created', done => {
  const getEvents = require('../events');
  expect(getEvents).toThrowError(InvalidConfiguration);

  process.env.REDIS_ADDRESS = 'localhost';
  process.env.REDIS_PORT = 6379;
  const eventsSingleton = getEvents();
  expect(eventsSingleton).toBeInstanceOf(RedisMock);

  const events = getEvents();
  expect(events).toBe(eventsSingleton);
  done();
});
