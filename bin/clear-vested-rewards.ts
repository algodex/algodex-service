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

const getDatabases = require('../src/db/get-databases');

const clearRewards = async () => {
  console.log("Going to delete all old records from vested_rewards");
  const databases = getDatabases();
  const db = databases.vested_rewards;
  const allDocs = await db.allDocs();
  console.log(allDocs.rows.filter(row => row.id.includes(":")).length + " docs to delete");
  const deletePromises = allDocs.rows
    .filter(row => row.id.includes(":"))
    .map(row => {
      console.log("sending remove for: ", {id: row.id});
     return db.get(row.id).then(doc => db.remove(doc))
      .then(console.log("removed "+row.id)).catch(e => console.log("failed to remove " + row.id, e))
    });
  await Promise.allSettled(deletePromises);
};


clearRewards();

export {};
