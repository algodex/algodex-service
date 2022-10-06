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

const withDBSchemaCheck = require('../../../schema/with-db-schema-check');
const fs = require('fs');
const getDatabases = require('../../../db/get-databases');

const testSchema = dbName => {
  test(`${dbName} schema should pass`, ()=>{
    const json =
      fs.readFileSync(`./src/__tests__/schema/db/${dbName}.json`);
    const obj = JSON.parse(json);
    const isValid = withDBSchemaCheck(dbName, obj);
    expect(isValid).toBeTruthy();
  });
};

const databases = getDatabases();
Object.keys(databases)
    .filter(dbName => dbName !== 'prices')
    .forEach(dbName => testSchema(dbName));


