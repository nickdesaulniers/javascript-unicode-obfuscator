#! /usr/bin/env node
var fs = require('fs');

var input = fs.readFileSync(process.argv[2], { encoding: 'utf8' });

var output = '';

function lPad (input) {
  for (var j = input.length; j < 4; ++j) {
    input = '0' + input;
  }
  return input;
};

var inString = false;

for (var i = 0; i < input.length; ++i) {
  var unicode = input[i].charCodeAt().toString(16);
  // ' "
  if (unicode == 27 || unicode == 22) {
    inString = !inString;
    output += input[i];
  } else if (unicode == 28 || unicode == 29 || unicode == 27 ||
             unicode === '3b' || unicode == 'a') {
    // ( ) ; <return>
    output += input[i];
  } else if (inString) {
    output += '\\x' + unicode;
  } else {
    output += '\\u' + lPad(unicode);
  }
}

console.log(output);

