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

// eslint-disable-next-line no-unused-vars
const ALGX = require('../../src/algx-types');

/**
 * Add Prices
 * @type {function}
 */
const addPrices = require('./tinyman/prices');

/**
 * @param {{events: ALGX.Redis, databases: ALGX.PouchDB}} moduleInput
 */
module.exports = ({events, databases}) =>{
  const db = databases.prices;
  console.log('Starting');
  events.subscribe('blocks', (err, count) => {
    console.log('Subscribed to Blocks');
  });

  events.on('message', (channel, message)=>{
    addPrices(db, Date.now());
  });
};

