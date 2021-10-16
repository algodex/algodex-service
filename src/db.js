const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-http'));

let db;

const url = process.env['COUCHDB_URL'] || 'http://admin:dex@couchdb:5984/dex';
// Singleton factory pattern for Database
module.exports = function() {
    if(typeof db === 'undefined'){
        db = new PouchDB(url);
    }
    return db;
}