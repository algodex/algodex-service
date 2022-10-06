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


const convertURL = dbUrl => {
  const prefix = 'integration_test__';
  const isIntegrationTest = process.env.INTEGRATION_TEST_MODE &&
    process.env.INTEGRATION_TEST_MODE !== '0';

  if (dbUrl.includes(prefix)) {
    return dbUrl;
  }
  if (isIntegrationTest) {
    const regex = /(^.*\/)([^\/]+)/;
    const matches = dbUrl.match(regex);
    // console.log(match[1]); // abc
    const matchesArr = Array.from(matches);
    return matchesArr[1] + prefix+matchesArr[2];
    // return dbUrl.replaceAll(matchesArr[1], '__test_'+matchesArr[1]);
  }
  return dbUrl;
};

module.exports = convertURL;
