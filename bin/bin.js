#! /usr/bin/env node
var fs = require('fs');
var esprima = require('esprima');

var input = fs.readFileSync(process.argv[2], { encoding: 'utf8' });

var output = '';

function lPad (input, count) {
  for (var j = input.length; j < count; ++j) {
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
      output += '\\x' + lPad(handler._toUnicode(str[i]), 2);
    }
  },
  _toUnicodeStr2: function (str) {
    for (var i = 0; i < str.length; ++i) {
      output += '\\u' + lPad(handler._toUnicode(str[i]), 4);
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
    } else if (node.value instanceof RegExp) {
      output += node.raw;
    } else if (node.value === null) {
      handler._toUnicodeStr2('null');
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
      if (i !== node.arguments.length - 1) {
        output += ', ';
      }
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
    output += ') ';
    handler[node.body.type](node.body);
  },
  FunctionExpression: function (node) {
    output += '(';
    handler._toUnicodeStr2('function');
    output += ' ';
    if (node.id) {
      handler[node.id.type](node.id);
    }
    output += ' (';
    for (var i = 0; i < node.params.length; ++i) {
      handler[node.params[i].type](node.params[i]);
      if (i !== node.params.length - 1) {
        output += ', ';
      }
    }
    output += ') ';
    handler[node.body.type](node.body);
    output += ')';
  },
  BlockStatement: function (node) {
    output += '{\n';
    for (var i = 0; i < node.body.length; ++i) {
      handler[node.body[i].type](node.body[i]);
      output += ';\n';
    }
    output += '}';
  },
  EmptyStatement: function () {},
  LogicalExpression: function (node) {
    output += '(';
    handler[node.left.type](node.left);
    output += ' ' + node.operator + ' ';
    handler[node.right.type](node.right);
    output += ')';
  },
  BinaryExpression: function (node) {
    output += '(';
    handler[node.left.type](node.left);
    output += ' ' + node.operator + ' ';
    handler[node.right.type](node.right);
    output += ')';
  },
  Identifier: function (node) {
    handler._toUnicodeStr2(node.name);
  },
  MemberExpression: function (node) {
    if (node.computed) {
      if (node.object.type === 'LogicalExpression') {
        output += '(';
      }
      handler[node.object.type](node.object);
      if (node.object.type === 'LogicalExpression') {
        output += ')';
      }
      output += '[';
      handler[node.property.type](node.property);
      output += ']';
    } else {
      handler[node.object.type](node.object);
      output += '.';
      handler[node.property.type](node.property);
    }
  },
  IfStatement: function (node) {
    output += 'if (';
    handler[node.test.type](node.test);
    output += ') '
    handler[node.consequent.type](node.consequent);
    if (node.alternate) {
      output += ' else ';
      handler[node.alternate.type](node.alternate);
    }
  },
  ConditionalExpression: function (node) {
    handler[node.test.type](node.test);
    output += ' ? ';
    handler[node.consequent.type](node.consequent);
    output += ' : ';
    if (node.alternate.type === 'LogicalExpression') {
      output += '(';
    }
    handler[node.alternate.type](node.alternate);
    if (node.alternate.type === 'LogicalExpression') {
      output += ')';
    }
  },
  UnaryExpression: function (node) {
    if (node.prefix) {
      if (node.operator === 'void') {
        handler._toUnicodeStr2('void');
        output += ' ';
      } else if (node.operator === 'typeof') {
        handler._toUnicodeStr2('typeof');
        output += ' ';
      } else {
        output += node.operator;
      }
      handler[node.argument.type](node.argument);
    } else {
      handler[node.argument.type](node.argument);
      output += node.operator;
    }
  },
  ArrayExpression: function (node) {
    output += '[';
    for (var i = 0; i < node.elements.length; ++i) {
      handler[node.elements[i].type](node.elements[i]);
      if (i !== node.elements.length - 1) {
        output += ', ';
      }
    }
    output += ']';
  },
  VariableDeclaration: function (node) {
    if (node.kind === 'var') {
      handler._toUnicodeStr2('var');
      output += ' ';
      for (var i = 0; i < node.declarations.length; ++i) {
        handler[node.declarations[i].type](node.declarations[i]);
        if (i !== node.declarations.length - 1) {
          output += ', ';
        }
      }
    } else {
      console.error('Unknown kind of variable declaration');
    }
  },
  VariableDeclarator: function (node) {
    handler[node.id.type](node.id);
    if (node.init) {
      output += ' = ';
      handler[node.init.type](node.init);
    }
  },
  AssignmentExpression: function (node) {
    output += '(';
    handler[node.left.type](node.left);
    output += ' ' + node.operator + ' ';
    handler[node.right.type](node.right);
    output += ')';
  },
  ThrowStatement: function (node) {
    output += 'throw ';
    handler[node.argument.type](node.argument);
  },
  NewExpression: function (node) {
    handler._toUnicodeStr2('new');
    output += ' ';
    handler[node.callee.type](node.callee);
    output += ' (';
    for (var i = 0; i < node.arguments.length; ++i) {
      handler[node.arguments[i].type](node.arguments[i]);
      if (i !== node.arguments.length - 1) {
        output += ', ';
      }
    }
    output += ')';
  },
  ReturnStatement: function (node) {
    output += 'return';
    if (node.argument) {
      output += ' ';
      handler[node.argument.type](node.argument);
    }
  },
  ThisExpression: function (node) {
    handler._toUnicodeStr2('this');
  },
  ObjectExpression: function (node) {
    output += '{';
    if (node.properties.length > 0) {
      output += '\n';
    }
    for (var i = 0; i < node.properties.length; ++i) {
      handler[node.properties[i].key.type](node.properties[i].key);
      output += ': ';
      handler[node.properties[i].value.type](node.properties[i].value);
      output += ',\n';
    }
    output += '}';
  },
  UpdateExpression: function (node) {
    if (node.prefix) {
      output += node.operator;
      handler[node.argument.type](node.argument);
    } else {
      handler[node.argument.type](node.argument);
      output += node.operator;
    }
  },
  ForStatement: function (node) {
    handler._toUnicodeStr2('for');
    output += ' (';
    if (node.init) {
      handler[node.init.type](node.init);
    }
    output += ';';
    if (node.test) {
      output += ' ';
      handler[node.test.type](node.test);
    }
    output += ';';
    if (node.update) {
      output += ' ';
      handler[node.update.type](node.update);
    }
    output += ') ';
    handler[node.body.type](node.body);
  },
  ForInStatement: function (node) {
    if (node.each) {
      console.error('XXX ForIn each');
      console.log(node);
    }
    handler._toUnicodeStr2('for');
    output += ' (';
    handler[node.left.type](node.left);
    output += ' in '; // can we unicode?
    handler[node.right.type](node.right);
    output += ') ';
    handler[node.body.type](node.body);
  },
  ContinueStatement: function (node) {
    if (node.label) {
      console.error('XXX Con label');
      console.log(node);
    }
    handler._toUnicodeStr2('continue');
  },
  WhileStatement: function (node) {
    handler._toUnicodeStr2('while');
    output += ' (';
    handler[node.test.type](node.test);
    output += ') ';
    handler[node.body.type](node.body);
  },
  BreakStatement: function (node) {
    if (node.label) {
      console.error('XXX bre label');
      console.log(node);
    }
    handler._toUnicodeStr2('break');
  },
  TryStatement: function (node) {
    if (node.guardedHandlers.length) {
      console.error('XXX Try guard');
      console.log(node);
    }
    handler._toUnicodeStr2('try');
    output += ' ';
    handler[node.block.type](node.block);
    for (var i = 0; i < node.handlers.length; ++i) {
      output += ' ';
      handler._toUnicodeStr2('catch');
      output += ' ';
      handler[node.handlers[i].type](node.handlers[i]);
    }
    if (node.finalizer) {
      output += ' ';
      handler._toUnicodeStr2('finally');
      output += ' ';
      handler[node.finalizer.type](node.finalizer);
    }
  },
  CatchClause: function (node) {
    output += '(';
    handler[node.param.type](node.param);
    output += ') ';
    handler[node.body.type](node.body);
  },
  DoWhileStatement: function (node) {
    handler._toUnicodeStr2('do');
    output += ' ';
    handler[node.body.type](node.body);
    output += ' ';
    handler._toUnicodeStr2('while');
    output += ' (';
    handler[node.test.type](node.test);
    output += ')';
  },
  SequenceExpression: function (node) {
    for (var i = 0; i < node.expressions.length; ++i) {
      handler[node.expressions[i].type](node.expressions[i]);
      if (i !== node.expressions.length - 1) {
        output += ', ';
      }
    }
  },
};

tree.forEach(function (node) {
  if (node.type !== 'EmptyStatement') {
    handler[node.type](node);
    output += ';\n';
  }
});

console.log(output);
