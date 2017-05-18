/**
 * Created by yzyzsun on 2017/2/2.
 */

'use strict';

const {
  PyObject, PyTypeObject, PyFunctionObject,
  PyBuiltinObject, PyIntObject, PyBoolObject, PyFloatObject, PyStrObject, PyListObject, PyDictObject, PySetObject,
  objectType, noneObject, falseObject, trueObject,
} = require('./object');

function get(identifier) {
  return ['primary', ['identifier', identifier]];
}
function call(identifier, method, ...argv) {
  return ['call', ['primary', ['attributeref', get(identifier), ['identifier', method]]], argv];
}
function setSpecialMethod(name) {
  builtins.set(name, new PyFunctionObject(name, ['x'], [['return', call('x', `__${name}__`)]]));
}

const builtins = new Map();
setSpecialMethod('abs');
builtins.set('all', new PyFunctionObject('all', ['iterable'], [
  ['for', ['identifier', 'item'], get('iterable'), [
    ['if', ['not', ['truth', get('item')]], [['return', ['bool', false]]], [], []],
  ], []],
  ['return', ['bool', true]],
]));
builtins.set('any', new PyFunctionObject('any', ['iterable'], [
  ['for', ['identifier', 'item'], get('iterable'), [
    ['if', ['truth', get('item')], [['return', ['bool', true]]], [], []],
  ], []],
  ['return', ['bool', false]],
]));
builtins.set('bool', new PyFunctionObject('bool', ['x'], [['return', ['truth', get('x')]]]));
builtins.set('chr', i => new PyStrObject(String.fromCharCode(i.value)));
builtins.set('filter', new PyFunctionObject('filter', ['func', 'iterable'], [
  ['assign', ['identifier', 'result'], ['list', []]],
  ['for', ['identifier', 'item'], get('iterable'), [
    ['if', ['truth', ['call', get('func'), [get('item')]]], [call('result', 'append', get('item'))], [], []],
  ], []],
  ['return', get('result')],
]));
setSpecialMethod('len');
builtins.set('map', new PyFunctionObject('map', ['func', 'iterable'], [
  ['assign', ['identifier', 'result'], ['list', []]],
  ['for', ['identifier', 'item'], get('iterable'), [
    call('result', 'append', ['call', get('func'), [get('item')]]),
  ], []],
  ['return', get('result')],
]));
builtins.set('max', (...argv) => {
  if (argv.length === 1) argv = argv[0];
  let max = argv[0];
  for (const item of argv) {
    if (item.get('__gt__')(item, max) === trueObject) max = item;
  }
  return max;
});
builtins.set('min', (...argv) => {
  if (argv.length === 1) argv = argv[0];
  let min = argv[0];
  for (const item of argv) {
    if (item.get('__lt__')(item, min) === trueObject) min = item;
  }
  return min;
});
builtins.set('ord', c => new PyIntObject(c.value.charCodeAt(0)));
builtins.set('pow', new PyFunctionObject('pow', ['x', 'y'], [['return', call('x', '__pow__', get('y'))]]));
builtins.set('range', (...argv) => {
  let start = 0, stop = 0, step = 1;
  switch (argv.length) {
  case 3:
    step = argv[2].value;
  case 2:
    start = argv[0].value;
    stop = argv[1].value;
    break;
  case 1:
    stop = argv[0].value;
  }
  let result = [];
  for (let i = start; i < stop; i += step) {
    result.push(new PyIntObject(i));
  }
  return new PyListObject(result);
});
setSpecialMethod('repr');
builtins.set('round', x => new PyIntObject(Math.round(x.value)));
setSpecialMethod('str');
builtins.set('sum', new PyFunctionObject('sum', ['iterable'], [
  ['assign', ['identifier', 'iterable'], call('iterable', 'copy')],
  ['assign', ['identifier', 'result'], call('iterable', 'pop', ['int', 0])],
  ['for', ['identifier', 'item'], get('iterable'), [
    call('result', '__iadd__', get('item')),
  ], []],
  ['return', get('result')],
]));
builtins.set('type', x => new PyStrObject(x.type.name));

exports.builtins = builtins;
