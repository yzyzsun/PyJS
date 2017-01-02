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
  set(identifier) {
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
objectType.members.set('__str__', '<object>');
objectType.members.set('__eq__', (self, other) => self === other);
objectType.members.set('__ne__', (self, other) => self !== other);

const noneType = new PyTypeObject('NoneType', [objectType]);
noneType.members.set('__str__', self => 'None');
const noneObject = new PyBuiltinObject(noneType, null);

const numericType = new PyTypeObject('numeric', [objectType]);
numericType.members.set('__lt__', (self, other) => self < other);
numericType.members.set('__le__', (self, other) => self <= other);
numericType.members.set('__gt__', (self, other) => self > other);
numericType.members.set('__ge__', (self, other) => self >= other);
numericType.members.set('__bool__', self => self !== 0);
numericType.members.set('__pos__', self => +self);
numericType.members.set('__neg__', self => -self);
numericType.members.set('__abs__', self => Math.abs(self));
numericType.members.set('__invert__', self => ~self);
numericType.members.set('__add__', (self, other) => self + other);
numericType.members.set('__sub__', (self, other) => self - other);
numericType.members.set('__mul__', (self, other) => self * other);
numericType.members.set('__truediv__', (self, other) => self / other);
numericType.members.set('__floordiv__', (self, other) => Math.floor(self / other));
numericType.members.set('__mod__', (self, other) => self % other);
numericType.members.set('__pow__', (self, other) => self ** other);
numericType.members.set('__lshift__', (self, other) => self << other);
numericType.members.set('__rshift__', (self, other) => self >> other);
numericType.members.set('__and__', (self, other) => self & other);
numericType.members.set('__xor__', (self, other) => self ^ other);
numericType.members.set('__or__', (self, other) => self | other);

const intType = new PyTypeObject('int', [numericType]);
intType.members.set('__str__', self => self.toString());
class PyIntObject extends PyBuiltinObject {
  constructor(int) {
    super(intType, int);
  }
}

const floatType = new PyTypeObject('float', [numericType]);
floatType.members.set('__str__', self => self % 1 === 0 ? self.toFixed(1) : self.toString());
floatType.members.set('is_integer', self => self % 1 === 0);
class PyFloatObject extends PyBuiltinObject {
  constructor(float) {
    super(floatType, float);
  }
}

const boolType = new PyTypeObject('bool', [numericType]);
boolType.members.set('__str__', self => self ? 'True' : 'False');
const falseObject = new PyBuiltinObject(boolType, 0);
const trueObject = new PyBuiltinObject(boolType, 1);

const strType = new PyTypeObject('str', [objectType]);
strType.members.set('__str__', self => self);
strType.members.set('__len__', self => self.length);
strType.members.set('__getitem__', (self, key) => self[key]);
strType.members.set('__contains__', (self, value) => self.includes(value));
strType.members.set('__add__', (self, other) => self + other);
strType.members.set('__mul__', (self, other) => self.repeat(other));
strType.members.set('endswith', (self, suffix) => self.endsWith(suffix));
strType.members.set('find', (self, sub) => self.indexOf(sub));
strType.members.set('isalpha', self => self.search(/[^A-Za-z]/) === -1);
strType.members.set('isdecimal', self => self.search(/\D/) === -1);
strType.members.set('isidentifier', self => self.search(/^[A-Za-z_]\w*$/) !== -1);
strType.members.set('islower', self => self.search(/[^a-z]/) === -1);
strType.members.set('isspace', self => self.search(/\S/) === -1);
strType.members.set('isupper', self => self.search(/[^A-Z]/) === -1);
strType.members.set('join', (self, iterable) => iterable.join(self));
strType.members.set('lower', self => self.toLowerCase());
strType.members.set('replace', (self, oldValue, newValue) => self.replace(oldValue, newValue));
strType.members.set('rfind', (self, sub) => self.lastIndexOf(sub));
strType.members.set('split', (self, sep = /\s+/) => self.split(sep));
strType.members.set('startswith', (self, prefix) => self.startsWith(prefix));
strType.members.set('strip', (self, prefix) => self.trim());
strType.members.set('upper', self => self.toUpperCase());
class PyStrObject extends PyBuiltinObject {
  constructor(str) {
    super(strType, str);
  }
}

const listType = new PyTypeObject('list', [objectType]);
listType.members.set('__str__', self => `[${self.join(', ')}]`);
listType.members.set('__len__', self => self.length);
listType.members.set('__getitem__', (self, key) => self[key]);
listType.members.set('__setitem__', (self, key, value) => { self[key] = value; });
listType.members.set('__delitem__', (self, key) => { self.splice(key, 1); });
listType.members.set('__contains__', (self, value) => self.includes(value));
listType.members.set('__add__', (self, other) => self.concat(other));
listType.members.set('__mul__', (self, other) => [].concat(...(new Array(other)).fill(self)));
listType.members.set('append', (self, value) => { self.push(value); });
listType.members.set('clear', self => { self.length = 0; });
listType.members.set('copy', self => self.slice());
listType.members.set('insert', (self, key, value) => { self.splice(key, 0, value); });
listType.members.set('pop', (self, key = null) => key === null ? self.pop() : self.splice(key, 1)[0]);
listType.members.set('remove', (self, value) => { self.splice(self.indexOf(value), 1); });
listType.members.set('reverse', self => { self.reverse(); });
listType.members.set('sort', self => { self.sort((x, y) => x - y); });
class PyListObject extends PyBuiltinObject {
  constructor(list) {
    super(listType, list);
  }
}

const dictType = new PyTypeObject('dict', [objectType]);
dictType.members.set('__str__', self => `{${[...self.entries()].map(a => `${a[0]}: ${a[1]}`).join(', ')}}`);
dictType.members.set('__len__', self => self.size);
dictType.members.set('__getitem__', (self, key) => self.get(key));
dictType.members.set('__setitem__', (self, key, value) => { self.set(key, value); });
dictType.members.set('__delitem__', (self, key) => { self.delete(key); });
dictType.members.set('__contains__', (self, value) => self.has(value));
dictType.members.set('clear', self => { self.clear(); });
dictType.members.set('copy', self => new Map(self));
dictType.members.set('get', (self, key, defaultValue = null) => self.has(key) ? self.get(key) : defaultValue);
dictType.members.set('pop', (self, key, defaultValue = null) => {
  const value = this.get(self, key, defaultValue);
  self.delete(self, key);
  return value;
});
dictType.members.set('update', (self, other) => {
  for (const item of other) {
    self.set(item[0], item[1]);
  }
});
class PyDictObject extends PyBuiltinObject {
  constructor(dict) {
    super(dictType, dict);
  }
}

const setType = new PyTypeObject('set', [objectType]);
setType.members.set('__str__', self => `{${[...self.values()].join(', ')}}`);
setType.members.set('__len__', self => self.size);
setType.members.set('__contains__', (self, value) => self.has(value));
setType.members.set('add', (self, value) => { self.add(value); });
setType.members.set('clear', self => { self.clear(); });
setType.members.set('copy', self => new Set(self));
setType.members.set('discard', (self, value) => { self.delete(value); });
class PySetObject extends PyBuiltinObject {
  constructor(dict) {
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
  has(identifier) {
    return this.locals.has(identifier);
  }
  get(identifier) {
    this.locals.get(identifier);
  }
  set(identifier, value) {
    this.locals.set(identifier, value);
  }
  delete(identifier) {
    this.locals.delete(identifier);
  }
}

module.exports = {
  PyObject, PyTypeObject, PyFunctionObject,
  PyBuiltinObject, PyIntObject, PyFloatObject, PyStrObject, PyListObject, PyDictObject, PySetObject,
  noneObject, falseObject, trueObject,
};
