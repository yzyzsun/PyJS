#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const interpreter = require('./interpreter').interpreter;

process.argv.slice(2).forEach(arg => {
  const file = path.normalize(arg);
  interpreter.interpret(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file + '.ast', interpreter.toString());
  console.log(interpreter.output);
});
