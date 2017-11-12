/**
 * Created by yzyzsun on 2016/12/21.
 */

'use strict';

class PyObject {
  constructor(type) {
    this.type = type;
    this.members = new Map();
  }
  get(identifier) {
    if (this.members.has(identifier)) {
      return this.members.get(identifier);
    } else {
      return this.type.get(identifier);
    }
  }
  set(identifier, value) {
    this.members.set(identifier, value);
  }
  delete(identifier) {
    return this.members.delete(identifier);
  }
}

class PyTypeObject extends PyObject {
  constructor(name, bases) {
    super({ name: 'type', bases: [] });
    this.name = name;
    this.bases = bases;
  }
  get(identifier) {
    if (this.members.has(identifier)) {
      return this.members.get(identifier);
    }
    for (const base of this.bases) {
      const member = base.get(identifier);
      if (member !== undefined) return member;
    }
    return undefined;
  }
}

class PyBuiltinObject extends PyObject {
  constructor(type, value) {
    super(type);
    this.value = value;
  }
}

const objectType = new PyTypeObject('object', []);

const noneType = new PyTypeObject('NoneType', [objectType]);
const noneObject = new PyBuiltinObject(noneType, null);

const numericType = new PyTypeObject('numeric', [objectType]);

const intType = new PyTypeObject('int', [numericType]);
class PyIntObject extends PyBuiltinObject {
  constructor(int) {
    super(intType, int);
  }
}

const boolType = new PyTypeObject('bool', [intType]);
const falseObject = new PyBuiltinObject(boolType, 0);
const trueObject = new PyBuiltinObject(boolType, 1);
function PyBoolObject(bool) {
  return bool ? trueObject : falseObject;
}

const floatType = new PyTypeObject('float', [numericType]);
class PyFloatObject extends PyBuiltinObject {
  constructor(float) {
    super(floatType, float);
  }
}

const strType = new PyTypeObject('str', [objectType]);
class PyStrObject extends PyBuiltinObject {
  constructor(str) {
    super(strType, str);
  }
}

const listType = new PyTypeObject('list', [objectType]);
class PyListObject extends PyBuiltinObject {
  constructor(list) {
    super(listType, list);
  }
}

const dictType = new PyTypeObject('dict', [objectType]);
class PyDictObject extends PyBuiltinObject {
  constructor(dict) {
    super(dictType, dict);
  }
}

const setType = new PyTypeObject('set', [objectType]);
class PySetObject extends PyBuiltinObject {
  constructor(set) {
    super(setType, set);
  }
}

const functionType = new PyTypeObject('function', [objectType]);
class PyFunctionObject extends PyObject {
  constructor(funcname, parameters, statements) {
    super(functionType);
    this.funcname = funcname;
    this.parameters = parameters;
    this.statements = statements;
  }
  get(identifier) {
    if (identifier === '__str__' || identifier === '__repr__') return self => new PyStrObject(`<function ${self.funcname}>`);
    return this.locals.get(identifier);
  }
  set(identifier, value) {
    this.locals.set(identifier, value);
  }
  delete(identifier) {
    this.locals.delete(identifier);
  }
}


function repr(x) {
  if (typeof x === 'string') {
    return `'${x.replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/\f/g, '\\f')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                .replace(/\v/g, '\\v')}'`;
  } else if (x === null) {
    return 'None';
  } else {
    return x.toString();
  }
}

function guardListIndex(list, index) {
  const { IndexError } = require('./error');
  const typeName = index.type.name;
  if (typeName !== 'int' && typeName !== 'bool') {
    throw new TypeError(`list indices must be integers, not ${typeName}`);
  }
  if (index.value < 0 || index.value >= list.value.length) {
    throw new IndexError('list index out of range');
  }
}

function guardHashable(x) {
  const typeName = x.type.name;
  const hashable = ['NoneType', 'int', 'bool', 'float', 'str'];
  if (!hashable.includes(typeName)) throw new TypeError(`unhashable type: '${typeName}'`);
}

function guardDictKey(dict, key) {
  const { KeyError } = require('./error');
  guardHashable(key);
  if (!dict.value.has(key.value)) throw new KeyError('dict key not exists');
}

objectType.members.set('__str__', self => new PyStrObject(`<${self.type.name} object>`));
objectType.members.set('__repr__', self => self.get('__str__')(self));
objectType.members.set('__eq__', (self, other) => PyBoolObject(self === other));
objectType.members.set('__ne__', (self, other) => PyBoolObject(self.get('__eq__')(self, other) === falseObject));

noneType.members.set('__str__', self => new PyStrObject('None'));

numericType.members.set('__eq__', (self, other) => PyBoolObject(self.value === other.value));
numericType.members.set('__lt__', (self, other) => PyBoolObject(self.value <   other.value));
numericType.members.set('__le__', (self, other) => PyBoolObject(self.value <=  other.value));
numericType.members.set('__gt__', (self, other) => PyBoolObject(self.value >   other.value));
numericType.members.set('__ge__', (self, other) => PyBoolObject(self.value >=  other.value));
numericType.members.set('__bool__', self => PyBoolObject(self.value !== 0));
numericType.members.set('__truediv__', (self, other) => new PyFloatObject(self.value / other.value));
numericType.members.set('__iadd__', (self, other) => { self.value += other.value; });
numericType.members.set('__isub__', (self, other) => { self.value -= other.value; });
numericType.members.set('__imul__', (self, other) => { self.value *= other.value; });
numericType.members.set('__itruediv__', (self, other) => { self.value /= other.value; self.type = floatType; });
numericType.members.set('__ifloordiv__', (self, other) => { self.value =  Math.floor(self.value / other.value); });
numericType.members.set('__imod__', (self, other) => { self.value %= other.value; });
numericType.members.set('__ipow__', (self, other) => { self.value **= other.value; });

intType.members.set('__str__', self => new PyStrObject(self.value.toString()));
intType.members.set('__pos__', self => new PyIntObject(+self.value));
intType.members.set('__neg__', self => new PyIntObject(-self.value));
intType.members.set('__abs__', self => new PyIntObject(Math.abs(self.value)));
intType.members.set('__invert__', self => new PyIntObject(~self.value));
intType.members.set('__add__', (self, other) => new PyIntObject(self.value + other.value));
intType.members.set('__sub__', (self, other) => new PyIntObject(self.value - other.value));
intType.members.set('__mul__', (self, other) => new PyIntObject(self.value * other.value));
intType.members.set('__floordiv__', (self, other) => new PyIntObject(Math.floor(self.value / other.value)));
intType.members.set('__mod__', (self, other) => new PyIntObject(self.value % other.value));
intType.members.set('__pow__', (self, other) => new PyIntObject(self.value ** other.value));
intType.members.set('__lshift__', (self, other) => new PyIntObject(self.value << other.value));
intType.members.set('__rshift__', (self, other) => new PyIntObject(self.value >> other.value));
intType.members.set('__and__', (self, other) => new PyIntObject(self.value & other.value));
intType.members.set('__xor__', (self, other) => new PyIntObject(self.value ^ other.value));
intType.members.set('__or__', (self, other) => new PyIntObject(self.value | other.value));
intType.members.set('__ilshift__', (self, other) => { self.value <<= other.value; });
intType.members.set('__irshift__', (self, other) => { self.value >>= other.value; });
intType.members.set('__iand__', (self, other) => { self.value &= other.value; });
intType.members.set('__ixor__', (self, other) => { self.value ^= other.value; });
intType.members.set('__ior__', (self, other) => { self.value |= other.value; });

boolType.members.set('__str__', self => new PyStrObject(self.value ? 'True' : 'False'));

floatType.members.set('__str__', self => new PyStrObject(self.value % 1 === 0 ? self.value.toFixed(1) : self.value.toString()));
floatType.members.set('__pos__', self => new PyFloatObject(+self.value));
floatType.members.set('__neg__', self => new PyFloatObject(-self.value));
floatType.members.set('__abs__', self => new PyFloatObject(Math.abs(self.value)));
floatType.members.set('__add__', (self, other) => new PyFloatObject(self.value + other.value));
floatType.members.set('__sub__', (self, other) => new PyFloatObject(self.value - other.value));
floatType.members.set('__mul__', (self, other) => new PyFloatObject(self.value * other.value));
floatType.members.set('__floordiv__', (self, other) => new PyFloatObject(Math.floor(self.value / other.value)));
floatType.members.set('__mod__', (self, other) => new PyFloatObject(self.value % other.value));
floatType.members.set('__pow__', (self, other) => new PyFloatObject(self.value ** other.value));
floatType.members.set('is_integer', self => PyBoolObject(self.value % 1 === 0));

strType.members.set('__str__', self => new PyStrObject(self.value));
strType.members.set('__repr__', self => new PyStrObject(repr(self.value)));
strType.members.set('__eq__', (self, other) => PyBoolObject(self.value === other.value));
strType.members.set('__lt__', (self, other) => PyBoolObject(self.value <   other.value));
strType.members.set('__le__', (self, other) => PyBoolObject(self.value <=  other.value));
strType.members.set('__gt__', (self, other) => PyBoolObject(self.value >   other.value));
strType.members.set('__ge__', (self, other) => PyBoolObject(self.value >=  other.value));
strType.members.set('__len__', self => new PyIntObject(self.value.length));
strType.members.set('__getitem__', (self, key) => new PyStrObject(self.value[key.value]));
strType.members.set('__contains__', (self, value) => PyBoolObject(self.value.includes(value.value)));
strType.members.set('__add__', (self, other) => new PyStrObject(self.value + other.value));
strType.members.set('__mul__', (self, other) => new PyStrObject(self.value.repeat(other.value)));
strType.members.set('__iadd__', (self, other) => { self.value += other.value; });
strType.members.set('__imul__', (self, other) => { self.value = self.value.repeat(other.value); });
strType.members.set('endswith', (self, suffix) => PyBoolObject(self.value.endsWith(suffix.value)));
strType.members.set('find', (self, sub) => new PyIntObject(self.value.indexOf(sub.value)));
strType.members.set('isalpha', self => PyBoolObject(self.value.search(/[^A-Za-z]/) === -1));
strType.members.set('isdecimal', self => PyBoolObject(self.value.search(/\D/) === -1));
strType.members.set('isidentifier', self => PyBoolObject(self.value.search(/^[A-Za-z_]\w*$/) !== -1));
strType.members.set('islower', self => PyBoolObject(self.value.search(/[^a-z]/) === -1));
strType.members.set('isspace', self => PyBoolObject(self.value.search(/\S/) === -1));
strType.members.set('isupper', self => PyBoolObject(self.value.search(/[^A-Z]/) === -1));
strType.members.set('join', (self, iterable) => new PyStrObject(iterable.value.map(x => x.get('__str__')(x).value).join(self.value)));
strType.members.set('lower', self => new PyStrObject(self.value.toLowerCase()));
strType.members.set('replace', (self, oldValue, newValue) => new PyStrObject(self.value.replace(oldValue.value, newValue.value)));
strType.members.set('rfind', (self, sub) => new PyIntObject(self.value.lastIndexOf(sub.value)));
strType.members.set('split', (self, sep = { value: /\s+/ }) => new PyStrObject(self.value.split(sep.value)));
strType.members.set('startswith', (self, prefix) => PyBoolObject(self.value.startsWith(prefix.value)));
strType.members.set('strip', self => new PyStrObject(self.value.trim()));
strType.members.set('upper', self => new PyStrObject(self.value.toUpperCase()));

listType.members.set('__str__', self => new PyStrObject(`[${self.value.map(x => x.get('__repr__')(x).value).join(', ')}]`));
listType.members.set('__eq__', (self, other) => {
  if (self.value.length !== other.value.length) return falseObject;
  for (let i = 0; i < self.value.length; i++) {
    const left  = self.value[i];
    const right = other.value[i];
    if (left.get('__eq__')(left, right) === falseObject) return falseObject;
  }
  return trueObject;
});
listType.members.set('__lt__', (self, other) => {
  let left, right;
  for (let i = 0; ; i++) {
    left  = self.value[i];
    right = other.value[i];
    if (left === undefined || right === undefined) break;
    if (left.get('__eq__')(left, right) === falseObject) break;
  }
  if (left === undefined && right !== undefined) return trueObject;
  else if (left === undefined || right === undefined) return falseObject;
  else return left.get('__lt__')(left, right);
});
listType.members.set('__le__', (self, other) => PyBoolObject(self.get('__lt__')(other, self) === falseObject));
listType.members.set('__gt__', (self, other) => PyBoolObject(self.get('__lt__')(other, self) === trueObject));
listType.members.set('__ge__', (self, other) => PyBoolObject(self.get('__lt__')(self, other) === falseObject));
listType.members.set('__len__', self => new PyIntObject(self.value.length));
listType.members.set('__getitem__', (self, key) => {
  guardListIndex(self, key);
  return self.value[key.value];
});
listType.members.set('__setitem__', (self, key, value) => {
  guardListIndex(self, key);
  self.value[key.value] = value;
});
listType.members.set('__delitem__', (self, key) => {
  guardListIndex(self, key);
  self.value.splice(key.value, 1);
});
listType.members.set('__contains__', (self, value) => {
  for (const item of self.value) {
    if (item.get('__eq__')(item, value) === trueObject) return trueObject;
  }
  return falseObject;
});
listType.members.set('__add__', (self, other) => new PyListObject(self.value.concat(other.value)));
listType.members.set('__mul__', (self, other) => new PyListObject([].concat(...(new Array(other.value)).fill(self.value))));
listType.members.set('__iadd__', (self, other) => { self.value = self.value.concat(other.value); });
listType.members.set('__imul__', (self, other) => { self.value = [].concat(...(new Array(other.value)).fill(self.value)); });
listType.members.set('append', (self, value) => { self.value.push(value); });
listType.members.set('clear', self => { self.value.length = 0; });
listType.members.set('copy', self => new PyListObject(self.value.slice()));
listType.members.set('insert', (self, key, value) => { self.value.splice(key.value, 0, value); });
listType.members.set('pop', (self, key = null) => key === null ? self.value.pop() : self.value.splice(key.value, 1)[0]);
listType.members.set('remove', (self, value) => { self.value.splice(self.value.indexOf(value), 1); });
listType.members.set('reverse', self => { self.value.reverse(); });
listType.members.set('sort', self => {
  self.value.sort((x, y) => {
    if (x.value < y.value) return -1;
    else if (x.value > y.value) return 1;
    else return 0;
  });
});

dictType.members.set('__str__', self => new PyStrObject(`{${[...self.value.entries()].map(x => `${repr(x[0])}: ${x[1].get('__repr__')(x[1]).value}`).join(', ')}}`));
dictType.members.set('__eq__', (self, other) => {
  if (self.value.size !== other.value.size) return falseObject;
  for (const [key, value] of self.value) {
    if (!other.value.has(key) || value.get('__eq__')(value, other.value.get(key)) === falseObject) return falseObject;
  }
  return trueObject;
});
dictType.members.set('__len__', self => new PyIntObject(self.value.size));
dictType.members.set('__getitem__', (self, key) => {
  guardDictKey(self, key);
  return self.value.get(key.value);
});
dictType.members.set('__setitem__', (self, key, value) => {
  guardHashable(key);
  self.value.set(key.value, value);
});
dictType.members.set('__delitem__', (self, key) => {
  guardDictKey(self, key);
  self.value.delete(key.value);
});
dictType.members.set('__contains__', (self, key) => {
  guardHashable(key);
  return PyBoolObject(self.value.has(key.value));
});
dictType.members.set('clear', self => { self.value.clear(); });
dictType.members.set('copy', self => new PyDictObject(new Map(self.value)));
dictType.members.set('get', (self, key, defaultValue = noneObject) => {
  guardHashable(key);
  return self.value.has(key.value) ? self.value.get(key.value) : defaultValue;
});
dictType.members.set('pop', (self, key, defaultValue = noneObject) => {
  guardHashable(key);
  if (self.value.has(key.value)) {
    const value = self.value.get(key.value);
    self.value.delete(key.value);
    return value;
  } else {
    return defaultValue;
  }
});
dictType.members.set('update', (self, other) => {
  for (const [key, value] of other.value) {
    self.value.set(key, value);
  }
});

setType.members.set('__str__', self => new PyStrObject(`{${[...self.value.values()].map(x => repr(x)).join(', ')}}`));
setType.members.set('__eq__', (self, other) => {
  if (self.value.size !== other.value.size) return falseObject;
  for (const value of self.value) {
    if (!other.value.has(value)) return falseObject;
  }
  return trueObject;
});
setType.members.set('__lt__', (self, other) => {
  if (self.value.size >= other.value.size) return falseObject;
  for (const value of self.value) {
    if (!other.value.has(value)) return falseObject;
  }
  return trueObject;
});
setType.members.set('__le__', (self, other) => PyBoolObject(self.get('__lt__')(self, other) === trueObject || self.get('__eq__')(self, other) === trueObject));
setType.members.set('__gt__', (self, other) => PyBoolObject(self.get('__lt__')(other, self) === trueObject));
setType.members.set('__ge__', (self, other) => PyBoolObject(self.get('__lt__')(other, self) === trueObject || self.get('__eq__')(self, other) === trueObject));
setType.members.set('__len__', self => new PyIntObject(self.value.size));
setType.members.set('__contains__', (self, value) => {
  guardHashable(value);
  return PyBoolObject(self.value.has(value.value));
});
setType.members.set('add', (self, value) => {
  guardHashable(value);
  self.value.add(value.value);
});
setType.members.set('clear', self => { self.value.clear(); });
setType.members.set('copy', self => new PySetObject(new Set(self.value)));
setType.members.set('discard', (self, value) => {
  guardHashable(value);
  self.value.delete(value.value);
});


module.exports = {
  PyObject, PyTypeObject, PyFunctionObject,
  PyBuiltinObject, PyIntObject, PyBoolObject, PyFloatObject, PyStrObject, PyListObject, PyDictObject, PySetObject,
  objectType, noneObject, falseObject, trueObject,
  guardHashable,
};
