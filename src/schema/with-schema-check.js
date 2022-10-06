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

const Ajv = require('ajv');
const ajv = new Ajv();

// eslint-disable-next-line require-jsdoc
class ValidationError extends Error {
  // eslint-disable-next-line require-jsdoc
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
};

module.exports = (schema, obj) => {
  // console.log({schema});
  const valid = ajv.validate(schema, obj);
  if (!valid) {
    const msg = JSON.stringify(obj) +
        ' VALIDATION ERROR: ' + JSON.stringify(ajv.errors);
    console.error(msg);
    throw new ValidationError(msg);
  }

  return valid;
};

