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

const PouchDB = require('pouchdb')
const PouchMapReduce = require('pouchdb-mapreduce');
PouchDB.plugin(PouchMapReduce)
const axios = require('axios').default;

export const isOptedIn = async (wallet:string):Promise<boolean> => {
  const db = getDatabase('blocks');
  const data = await db.query('blocks/algxRewardsOptin', {
    key: wallet,
    limit: 1,
  });

  const optedIn = data.rows.length > 0 && data.rows[0].key === wallet && data.rows[0].value === 1;
  return optedIn;
}

export const getAlgxBalance = async (wallet:string):Promise<number> => {
  const db = getDatabase('algx_balance');
  const data = await db.query('algx_balance/algx_balance', {
    key: wallet,
    limit: 1,
    reduce: true
  });

  const algxBalance:number = data.rows.length > 0 ? data.rows[0].value.balance : 0;
  return algxBalance;
}


export const getDatabase = (dbname:string) => {
  const fullUrl = process.env.COUCHDB_BASE_URL + '/' + dbname
  // console.log({fullUrl});
  const db = new PouchDB(fullUrl)
  return db
}


export const getAlgoPrice = async():Promise<number> => {
  const tinyManUrl = 'https://mainnet.analytics.tinyman.org/api/v1/current-asset-prices/';
  const prices = (await axios.get(tinyManUrl)).data;
  return prices[0].price;
}
