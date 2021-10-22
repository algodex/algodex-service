#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {program} from 'commander';
import {VIEWS_ROOT} from '../constants.js';
import {getAllFiles} from './utils/index.js';
import {getDatabase} from '../src/index.js';
import dotenv from 'dotenv';
import {fileURLToPath} from 'url';
dotenv.config();
const pkg = (await import('../package.json')).version;
program.version(pkg);
program.parse(process.argv);


/**
 * Load Views
 * Based on Couchapp folder structure
 * @return {{language: string, _id: string, views: {}}}
 */
function loadViews() {
  // const viewPath = path.join(PROJECT_ROOT, 'views');
  // url.URL(url.pathToFileURL(readDir))
  return getAllFiles(VIEWS_ROOT)
      .filter((file) => {
        return !file.pathname.match('__tests__');
      })
      .reduce((previousValue, file)=>{
        const filePath = fileURLToPath(file);
        const key = path.basename(path.dirname(filePath));
        const filename = path.parse(fileURLToPath(file)).name;
        let fn = fs.readFileSync(fileURLToPath(file)).toString();

        if (filename === 'map' || filename === 'reduce') {
          fn = fn.replace('module.exports = ', '');
          fn = fn.replace('../lib', 'views/lib');
          if (filename === 'reduce') {
            fn = fn.replace('\n', '');
          }
        }

        if (typeof previousValue.views[key] === 'undefined') {
          previousValue.views[key] = {};
        }
        previousValue.views[key][filename] = fn;

        return previousValue;
      }, {
        _id: '_design/dex',
        views: {},
        language: 'javascript',
      });
}

/**
 * Save a design document
 * @param {object} dd
 * @return {*}
 */
function save(dd) {
  return getDatabase()
      .put(dd)
      .then(console.log)
      .catch(console.error);
}

/**
 * Run this command
 */
function run() {
  // Check configuration and get program arguments;
  if ( typeof program.args[0] === 'undefined' &&
    typeof process.env.COUCHDB_URL === 'undefined'
  ) {
    throw new Error('Must pass in database or specify ENV variable!');
  } else if (typeof process.env.COUCHDB_URL === 'undefined') {
    process.env.COUCHDB_URL = program.args[0];
  }

  const dd = loadViews();

  getDatabase()
      .get('_design/dex')
      .then(({_rev})=>{
        console.log('Found');
        dd._rev = _rev;
        return save(dd);
      }).catch((e)=>{
        if (e.reason === 'missing') {
          return save(dd);
        }
      });
}

if (process.env.NODE_ENV !== 'test') {
  run();
}


