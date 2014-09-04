#! /usr/bin/env node
var fs = require('fs');
var esprima = require('esprima');

var input = fs.readFileSync(process.argv[2], { encoding: 'utf8' });

var output = '';

function lPad (input) {
  for (var j = input.length; j < 4; ++j) {
    input = '0' + input;
  }
  return input;
};

var tree = esprima.parse(input).body;

var handler = {
  _toUnicode: function (c) {
    return c.charCodeAt().toString(16);
  },
  _toUnicodeStr: function (str) {
    for (var i = 0; i < str.length; ++i) {
      output += '\\x' + handler._toUnicode(str[i]);
    }
  },
  _toUnicodeStr2: function (str) {
    for (var i = 0; i < str.length; ++i) {
      output += '\\u' + lPad(handler._toUnicode(str[i]));
    }
  },
  Literal: function (node) {
    if (typeof node.value === 'string') {
      output += node.raw[0];
      handler._toUnicodeStr(node.value);
      output += node.raw[0];
    } else if (typeof node.value === 'number') {
      output += node.value;
    } else if (typeof node.value === 'boolean'){
      //output += node.value;
      handler._toUnicodeStr2(node.value.toString());
    } else {
      console.error('Unkown literal type', node.value);
    }
  },
  ExpressionStatement: function (node) {
    handler[node.expression.type](node.expression);
  },
  CallExpression: function (node) {
    handler[node.callee.type](node.callee);
    output += '(';
    for (var i = 0; i < node.arguments.length; ++i) {
      handler[node.arguments[i].type](node.arguments[i]);
    }
    output += ')';
  },
  FunctionDeclaration: function (node) {
    handler._toUnicodeStr2('function');
    output += ' ';
    handler[node.id.type](node.id);
    output += ' (';
    for (var i = 0; i < node.params.length; ++i) {
      handler[node.params[i].type](node.params[i]);
      if (i !== node.params.length - 1) {
        output += ', ';
      }
    }
    output += ') {\n';
    handler[node.body.type](node.body);
    output += '}';
  },
  FunctionExpression: function (node) {
    output += '(';
    handler._toUnicodeStr2('function');
    output += ' ';
    handler[node.id.type](node.id);
    output += ' (';
    for (var i = 0; i < node.params.length; ++i) {
      handler[node.params[i].type](node.params[i]);
      if (i !== node.params.length - 1) {
        output += ', ';
      }
    }
    output += ') {\n';
    handler[node.body.type](node.body);
    output += '})';
  },
  BlockStatement: function (node) {
    for (var i = 0; i < node.body.length; ++i) {
      handler[node.body[i].type](node.body[i]);
      output += ';\n';
    }
  },
  EmptyStatement: function () {},
  LogicalExpression: function (node) {
    handler[node.left.type](node.left);
    output += ' ' + node.operator + ' ';
    handler[node.right.type](node.right);
  },
  BinaryExpression: function (node) {
    handler[node.left.type](node.left);
    output += ' ' + node.operator + ' ';
    handler[node.right.type](node.right);
  },
  Identifier: function (node) {
    handler._toUnicodeStr2(node.name);
  },
  MemberExpression: function (node) {
    if (node.computed) {
      console.err('XXX computed member expression');
    } else {
      handler[node.object.type](node.object);
      output += '.';
      handler[node.property.type](node.property);
    }
  },
  ConditionalExpression: function (node) {
    handler[node.test.type](node.test);
    output += ' ? ';
    handler[node.consequent.type](node.consequent);
    output += ' : ';
    handler[node.alternate.type](node.alternate);
  },
  UnaryExpression: function (node) {
    if (node.prefix) {
      output += node.operator;
      handler[node.argument.type](node.argument);
    } else {
      handler[node.argument.type](node.argument);
      output += node.operator;
    }
  },
  ArrayExpression: function (node) {
    output += '[';
    for (var i = 0; i < node.elements.length; ++i) {
      console.error('XXX Arr');
    }
    output += ']';
  },
  VariableDeclaration: function (node) {
    if (node.kind === 'var') {
      for (var i = 0; i < node.declarations.length; ++i) {
        handler[node.declarations[i].type](node.declarations[i]);
      }
    } else {
      console.error('Unknown kind of variable declaration');
    }
  },
  VariableDeclarator: function (node) {
    //output += 'var ';
    handler._toUnicodeStr2('var');
    output += ' ';
    handler[node.id.type](node.id);
    output += ' = ';
    handler[node.init.type](node.init);
  },
};

tree.forEach(function (node) {
  if (node.type !== 'EmptyStatement') {
    handler[node.type](node);
    output += ';\n';
  }
});

console.log(output);
