const fs = require('fs');
const path = require('path');
const {PROJECT_ROOT} = require('../constants');

describe('Algodex Test Suite', ()=>{
  describe('Core Components', ()=> {
    fs.readdirSync(path.join(PROJECT_ROOT, 'src', '__tests__'))
        .map((file) => {
          require(`../src/__tests__/${file}`);
        });
  });
  describe('Services', ()=> {
    fs.readdirSync(path.join(PROJECT_ROOT, 'services', '__tests__'))
        .map((file) => {
          require(`../services/__tests__/${file}`);
        });
  });
  describe('Map Reduce', ()=> {
    fs.readdirSync(path.join(PROJECT_ROOT, 'views', '__tests__'))
        .map((file) => {
          require(`../views/__tests__/${file}`);
        });
  });
  describe('Commands', ()=> {
    fs.readdirSync(path.join(PROJECT_ROOT, 'bin', '__tests__'))
        .map((file) => {
          require(`../bin/__tests__/${file}`);
        });
  });
  test('Fail until ready', ()=>{
    expect(1).toEqual(2);
  });
});
