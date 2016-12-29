/**
 * Created by yzyzsun on 2016/12/21.
 */

'use strict';

class PyObject {
  constructor(type) {
    this.type = type;
    this.members = {
      __eq__(self, other) {
        return self === other;
      },
      __ne__(self, other) {
        return !this.__eq__(self, other);
      },
      __lt__(self, other) {
        return self < other;
      },
      __le__(self, other) {
        return self <= other;
      },
      __gt__(self, other) {
        return self > other;
      },
      __ge__(self, other) {
        return self >= other;
      },
    };
  }
}

class PyTypeObject extends PyObject {
  constructor(name, bases) {
    super({ name: 'type', bases: [] });
    this.name = name;
    this.bases = bases;
  }
}

const intType = new PyTypeObject('int', []);
const floatType = new PyTypeObject('float', []);
const boolType = new PyTypeObject('bool', []);
const strType = new PyTypeObject('str', []);
const listType = new PyTypeObject('list', []);
const dictType = new PyTypeObject('dict', []);
const setType = new PyTypeObject('set', []);
const noneType = new PyTypeObject('NoneType', []);

class PyBuiltInObject extends PyObject {
  constructor(type, value) {
    super(type);
    this.value = value;
  }
}

const noneObject = new PyBuiltInObject(noneType, null);
Object.assign(noneObject.members, { __str__(self) { return 'None'; } });

class PyNumericObject extends PyBuiltInObject {
  constructor(type, value) {
    super(type, value);
    const members = {
      __bool__(self) {
        return self !== 0;
      },
      __pos__(self) {
        return +self;
      },
      __neg__(self) {
        return -self;
      },
      __abs__(self) {
        return Math.abs(self);
      },
      __invert__(self) {
        return ~self;
      },
      __add__(self, other) {
        return self + other;
      },
      __sub__(self, other) {
        return self - other;
      },
      __mul__(self, other) {
        return self * other;
      },
      __truediv__(self, other) {
        return self / other;
      },
      __floordiv__(self, other) {
        return Math.floor(self / other);
      },
      __mod__(self, other) {
        return self % other;
      },
      __pow__(self, other) {
        return self ** other;
      },
      __lshift__(self, other) {
        return self << other;
      },
      __rshift__(self, other) {
        return self >> other;
      },
      __and__(self, other) {
        return self & other;
      },
      __xor__(self, other) {
        return self ^ other;
      },
      __or__(self, other) {
        return self | other;
      },
    };
    Object.assign(this.members, members);
  }
}

class PyIntObject extends PyNumericObject {
  constructor(int) {
    super(intType, int);
    const members = {
      __str__(self) {
        return self.toString();
      },
    };
    Object.assign(this.members, members);
  }
}

class PyFloatObject extends PyNumericObject {
  constructor(float) {
    super(floatType, float);
    const members = {
      __str__(self) {
        return this.is_integer(self) ? self.toFixed(1) : self.toString();
      },
      is_integer(self) {
        return self % 1 === 0;
      },
    };
    Object.assign(this.members, members);
  }
}

const falseObject = new PyNumericObject(boolType, 0);
Object.assign(falseObject.members, { __str__(self) { return 'False'; } });

const trueObject = new PyNumericObject(boolType, 1);
Object.assign(trueObject.members, { __str__(self) { return 'True'; } });

class PyStrObject extends PyBuiltInObject {
  constructor(str) {
    super(strType, str);
    const members = {
      __str__(self) {
        return self;
      },
      __len__(self) {
        return self.length;
      },
      __getitem__(self, key) {
        return self[key];
      },
      __contains__(self, value) {
        return self.includes(value);
      },
      __add__(self, other) {
        return self + other;
      },
      __mul__(self, other) {
        return self.repeat(other);
      },
      endswith(self, suffix) {
        return self.endsWith(suffix);
      },
      find(self, sub) {
        return self.indexOf(sub);
      },
      isalnum(self) {
        return this.isalpha(self) || this.isdecimal(self);
      },
      isalpha(self) {
        return this.islower(self) || this.isupper(self);
      },
      isdecimal(self) {
        return self.search(/\D/) === -1;
      },
      isidentifier(self) {
        return self.search(/^[A-Za-z_]\w*$/) !== -1;
      },
      islower(self) {
        return self.search(/[^a-z]/) === -1;
      },
      isspace(self) {
        return self.search(/\S/) === -1;
      },
      isupper(self) {
        return self.search(/[^A-Z]/) === -1;
      },
      join(self, iterable) {
        return iterable.join(self);
      },
      lower(self) {
        return self.toLowerCase();
      },
      replace(self, oldValue, newValue) {
        return self.replace(oldValue, newValue);
      },
      rfind(self, sub) {
        return self.lastIndexOf(sub);
      },
      split(self, sep = /\s+/) {
        return self.split(sep);
      },
      startswith(self, prefix) {
        return self.startsWith(prefix);
      },
      strip(self) {
        return self.trim();
      },
      upper(self) {
        return self.toUpperCase();
      },
    };
    Object.assign(this.members, members);
  }
}

class PyListObject extends PyBuiltInObject {
  constructor(list) {
    super(listType, list);
    const members = {
      __str__(self) {
        return `[${self.join(', ')}]`;
      },
      __len__(self) {
        return self.length;
      },
      __getitem__(self, key) {
        return self[key];
      },
      __setitem__(self, key, value) {
        self[key] = value;
      },
      __delitem__(self, key) {
        self.splice(key, 1);
      },
      __contains__(self, value) {
        return self.includes(value);
      },
      __add__(self, other) {
        return self.concat(other);
      },
      __mul__(self, other) {
        const array = new Array(other);
        return [].concat(...array.fill(self));
      },
      append(self, value) {
        self.push(value);
      },
      clear(self) {
        self = [];
      },
      copy(self) {
        return self.slice();
      },
      extend(self, other) {
        self = this.__add__(self, other);
      },
      insert(self, key, value) {
        self = self.splice(key, 0, value);
      },
      pop(self, key = null) {
        if (key === null) {
          return self.pop();
        } else {
          const value = this.__getitem__(self, key);
          this.__delitem__(self, key);
          return value;
        }
      },
      remove(self, value) {
        const index = self.indexOf(value);
        this.pop(self, index);
      },
      reverse(self) {
        self.reverse();
      },
      sort(self) {
        self.sort((x, y) => x - y);
      },
    };
    Object.assign(this.members, members);
  }
}

class PyDictObject extends PyBuiltInObject {
  constructor(dict) {
    super(dictType, dict);
    const members = {
      __str__(self) {
        return `{${[...self.entries()].map(a => `${a[0]}: ${a[1]}`).join(', ')}}`;
      },
      __len__(self) {
        return self.size;
      },
      __getitem__(self, key) {
        return self.get(key);
      },
      __setitem__(self, key, value) {
        self.set(key, value);
      },
      __delitem__(self, key) {
        self.delete(key);
      },
      __contains__(self, value) {
        return self.has(value);
      },
      clear(self) {
        self.clear();
      },
      copy(self) {
        return new Map(self);
      },
      get(self, key, defaultValue = null) {
        return this.__contains__(self, key) ? this.__getitem__(self, key) : defaultValue;
      },
      pop(self, key, defaultValue = null) {
        const value = this.get(self, key, defaultValue);
        this.__delitem__(self, key);
        return value;
      },
      update(self, other) {
        for (const item of other) {
          this.__setitem__(self, item[0], item[1]);
        }
      },
    };
    Object.assign(this.members, members);
  }
}

class PySetObject extends PyBuiltInObject {
  constructor(set) {
    super(setType, set);
    const members = {
      __str__(self) {
        return `{${[...self.values()].join(', ')}}`
      },
      __len__(self) {
        return self.size;
      },
      __contains__(self, value) {
        return self.has(value);
      },
      add(self, value) {
        self.add(value);
      },
      clear(self) {
        self.clear();
      },
      copy(self) {
        return new Set(self);
      },
      discard(self, value) {
        self.delete(value);
      },
    };
    Object.assign(this.members, members);
  }
}
