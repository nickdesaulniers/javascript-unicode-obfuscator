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

var inSingleQuote = false;
var inDoubleQuote = false;
var inSlashStar = false;
var inSlashSlash = false;
var inEscape = 0;

for (var i = 0; i < input.length; ++i) {
  var unicode = input[i].charCodeAt().toString(16);
  // '
  if (unicode == 27 && !inDoubleQuote) {
    inSingleQuote = !inSingleQuote;
    output += input[i];
  } else if (unicode == 22 && !inSingleQuote) {
    // "
    inDoubleQuote = !inDoubleQuote;
    output += input[i];
  } else if (inEscape > 0) {
    output += input[i];
    --inEscape;
  } else if (unicode === '2f') {
    // /
    if (inSingleQuote || inDoubleQuote) {
      output += input[i];
    } else if (input[i + 1] === '*' && !inSlashSlash && !inSlashStar) {
      // /*
      inSlashStar = true;
    } else if (input[i + 1] === '/' && !inSlashSlash && !inSlashStar){
      // //
      inSlashSlash = true;
    }
  } else if (unicode === '2a') {
    // *
    if (input[i + 1] === '/' && inSlashStar) {
      if (inSingleQuote || inDoubleQuote) {
        output += input[i];
      } else {
        // */
        inSlashStar = false;
      }
    }
  } else if (inSlashStar) {
    continue;
  } else if (inSlashSlash) {
    if (unicode === 'a') {
      inSlashSlash = false;
      output += input[i];
    } else {
      continue;
    }
  } else if (unicode === '5c') {
    // \
    output += input[i];
    if (input[i + 1] === 'x') {
      inEscape += 3;
    } else if (input[i + 1] === 'd') {
      inEscape += 4;
    } else if (input[i + 1] === 'u') {
      inEscape += 5;
    } else {
      inEscape += 1;
    }
  } else if (unicode == 28 || unicode == 29 || unicode === '3b' ||
             unicode == 'a') {
    // ( ) ; <return>
    output += input[i];
  } else if (inSingleQuote || inDoubleQuote) {
    output += '\\x' + unicode;
  } else {
    output += '\\u' + lPad(unicode);
  }
}

console.log(output);

