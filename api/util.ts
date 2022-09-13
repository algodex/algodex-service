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
