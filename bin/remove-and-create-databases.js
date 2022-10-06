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

#!/usr/bin/env node

/* USAGE:
 *
 * This script will remove all non-append only DBs. You can also pass in the
 * optional argument removeExtra to remove more.
 *
 * bin/remove-and-create-databases [--removeExtra=DBNamesCommaSeparated]
 */

const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-erase'));
const getDatabases = require('../src/db/get-databases');
const args = require('minimist')(process.argv.slice(2));
// const removeAllExcept = args.removeAllExcept ?
//   args.removeAllExcept.split(',')
//       .reduce( (set, arg) => set.add(arg), new Set() ) :
//       new Set();
const extraDBsToRemoveSet = args.removeExtra ?
  args.removeExtra.split(',')
      .reduce( (set, arg) => set.add(arg), new Set() ) :
      new Set();
const removeAll = args.removeAll ? true : false;

// if (removeAllExcept.size() > 0 && extraDBsToRemoveSet.size > 0) {
//   throw new Error('--removeAllExcept and --removeExtra cannot both be set!');
// }
// eslint-disable-next-line require-jsdoc
async function runScript() {
  const databases = await getDatabases();
  const deletePromises = [];
  Object.values(databases).forEach( db => {
    if (!removeAll && db.appendOnly && !extraDBsToRemoveSet.has(db.dbName) ) {
      // Do not delete appendOnly databases
      return;
    }
    // if (db.appendOnly && removeAllExcept.has(db.dbName)) {
    //   return;
    // }
    console.log('REMOVING DB: ' + db.dbName);

    deletePromises.push(
        db.destroy().then(function(res) {
          console.log('destroyed');
        }).catch(function(e) {
          console.log('could not delete');
        }),
    );
  });

  Promise.all(deletePromises).then( async res => {
    console.log('starting creation');
    await getDatabases();
  });
}

runScript();

