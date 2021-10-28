import fs from 'fs';
import path from 'path';
import {PROJECT_ROOT} from '../constants';
import {pathToFileURL} from 'url';
import {createRequire} from 'module';
const require = createRequire(import.meta.url);
describe('Algodex Test Suite', ()=>{
  describe('Core Components', ()=> {
    fs.readdirSync(pathToFileURL(path.join('./src', '__tests__')))
        .map((file) => {
          import(`../src/__tests__/${file}`);
        });
  });
  describe('Services', ()=> {
    fs.readdirSync(pathToFileURL(path.join('./services', '__tests__')))
        .map((file) => {
          import(`../services/__tests__/${file}`);
        });
  });
  describe('Map Reduce', ()=> {
    fs.readdirSync(pathToFileURL(path.join('./views', '__tests__')))
        .map((file) => {
          import(`../views/__tests__/${file}`);
        });
  });
  describe('Commands', ()=> {
    fs.readdirSync(pathToFileURL(path.join('./bin', '__tests__')))
        .map((file) => {
          import(`./packages/service/runners/__tests__/${file}`);
        });
  });
  // test('Fail until ready', ()=>{
  //   expect(1).toEqual(2);
  // });
});
