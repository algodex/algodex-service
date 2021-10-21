#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {PROJECT_ROOT} = require('../constants');
const {getAllFiles} = require('../src/util');
const specPath = path.join(PROJECT_ROOT, 'spec');
const genPath = path.join(PROJECT_ROOT, 'src', 'models');

// Map and convert
getAllFiles(specPath)
    .forEach(function(file) {
      fs.writeFileSync(
          // Replace Paths
          file
              .replace(specPath, genPath)
              .replace('yml', 'json')
              .replace('yaml', 'json'),
          // Convert to JSON
          JSON.stringify(
              yaml.load(
                  fs.readFileSync(file, 'utf8'),
              ),
              null,
              2,
          ),
      );
    });
