const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-adapter-http'));
PouchDB.plugin(require('pouchdb-find'));
let db;

PouchDB.prototype.getExistingBlocks = async function (start){
    return await this.find({
        selector: {_id: {'$gte': start}},
    })
}

// Singleton factory pattern for Database
module.exports = function() {
    if(typeof db === 'undefined'){
        db = new PouchDB('http://admin:dex@localhost:5984/dex')
    }
    return db;
}