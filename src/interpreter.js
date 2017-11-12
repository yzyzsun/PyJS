/**
 * Created by yzyzsun on 2016/12/29.
 */

'use strict';

exports.interpreter = {
  preprocess(source) {
    return source.replace(/#.*/g, '')
                 .replace(/(\n|\r\n?)[ \t]*(?=\n|\r\n?)/g, '')
                 .trim();
  },
  
  parse(source) {
    require('./parser').parse(this.preprocess(source));
    this.ast = require('./parser').ast;
  },
  
  interpret(source) {
    const {
      PyObject, PyTypeObject, PyFunctionObject,
      PyBuiltinObject, PyIntObject, PyBoolObject, PyFloatObject, PyStrObject, PyListObject, PyDictObject, PySetObject,
      objectType, noneObject, falseObject, trueObject,
    } = require('./object');
    const {
      NameError, AttributeError,
    } = require('./error');
    
    const globals = new Map();
    let object = globals;
    let returnValue = noneObject;
    
    const builtins = require('./builtin').builtins;
    builtins.set('globals', () => new PyDictObject(globals));
    builtins.set('locals', () => {
      console.log(object.locals);
      if (object instanceof PyFunctionObject) return new PyDictObject(object.locals);
      else if (object instanceof PyTypeObject) return new PyDictObject(object.members);
      else return new PyDictObject(object)
    });
    builtins.set('print', (...argv) => this.output += argv.map(x => x.get('__str__')(x).value).join(' ') + '\n');
    
    let loopFlag = false;
    let breakFlag = false;
    let continueFlag = false;
    let returnFlag = false;
    
    const exec = expr => {
      if (breakFlag || continueFlag || returnFlag) return;
      if (!(expr instanceof Array)) return expr;
      switch (expr[0]) {
      case 'identifier':
        return {
          get() {
            let ret = object.get(expr[1]);
            if (ret === undefined) ret = globals.get(expr[1]);
            if (ret === undefined) ret = builtins.get(expr[1]);
            if (ret === undefined) throw new NameError(`name '${expr[1]}' is not defined`);
            return ret;
          },
          set(value) {
            object.set(expr[1], value);
          },
          delete() {
            if (!object.delete(expr[1])) {
              throw new NameError(`name '${expr[1]}' is not defined`);
            }
          },
        };
      case 'primary':
        return exec(expr[1]).get();
      case 'int':
        return new PyIntObject(expr[1]);
      case 'float':
        return new PyFloatObject(expr[1]);
      case 'bool':
        return PyBoolObject(expr[1]);
      case 'str':
        return new PyStrObject(expr[1]);
      case 'list':
        return new PyListObject(expr[1].map(exec));
      case 'dict':
        return new PyDictObject(new Map(expr[1].map(x => {
          const key = exec(x[0]), value = exec(x[1]);
          require('./object').guardHashable(key);
          return [key.value, value];
        })));
      case 'set':
        return new PySetObject(new Set(expr[1].map(x => {
          const value = exec(x);
          require('./object').guardHashable(value);
          return value.value;
        })));
      case 'NoneType':
        return noneObject;
      case 'attributeref': {
        const primary = exec(expr[1]);
        const identifier = expr[2][1];
        return {
          get() {
            const attribute = primary.get(identifier);
            if (typeof attribute === 'function') {
              return attribute.bind(null, primary);
            } else if (attribute instanceof PyFunctionObject) {
              const func = new PyFunctionObject(attribute.funcname, attribute.parameters, attribute.statements);
              func.object = primary;
              return func;
            } else if (attribute !== undefined) {
              return attribute;
            } else {
              throw new AttributeError(`'${primary.type.name}' object has no attribute '${identifier}'`);
            }
          },
          set(value) {
            primary.set(identifier, value);
          },
          delete() {
            if (!primary.delete(identifier)) {
              throw new AttributeError(`'${primary.type.name}' object has no attribute '${identifier}'`);
            }
          },
        };
      }
      case 'subscription': {
        const call = require('./parser').call;
        return {
          get() {
            return exec(call(expr[1], '__getitem__', [expr[2]]));
          },
          set(value) {
            return exec(call(expr[1], '__setitem__', [expr[2], value]));
          },
          delete() {
            return exec(call(expr[1], '__delitem__', [expr[2]]));
          },
        };
      }
      case 'call': {
        let callable = exec(expr[1]);
        let argv = expr[2].map(x => exec(x));
        if (typeof callable === 'function') {
          return callable(...argv);
        } else if (callable instanceof PyFunctionObject) {
          const params = callable.parameters;
          if (callable.hasOwnProperty('object')) argv.unshift(callable.object);
          if (params.length !== argv.length) {
            throw new TypeError(`${callable.funcname}() take ${params.length} arguments but ${argv.length} was given`);
          }
          callable.locals = new Map();
          for (let i = 0; i < params.length; i++) {
            callable.locals.set(params[i], argv[i]);
          }
          const oldObject = object;
          object = callable;
          for (const stmt of callable.statements) exec(stmt);
          object = oldObject;
          const ret = returnValue;
          returnValue = noneObject;
          returnFlag = false;
          return ret;
        } else if (callable instanceof PyTypeObject) {
          const obj = new PyObject(callable);
          exec(require('./parser').call(obj, '__init__', argv));
          return obj;
        } else {
          throw new TypeError(`'${callable.type.name}' object is not callable`);
        }
      }
      case 'truth': {
        const operand = exec(expr[1]);
        const boolFunc = operand.get('__bool__');
        if (boolFunc !== undefined) {
          const bool = exec(['call', boolFunc, [operand]]);
          if (bool.type.name === 'bool') {
            return bool;
          } else {
            throw new TypeError(`__bool__ should return bool, returned ${bool.type.name}`);
          }
        }
        const lenFunc = operand.get('__len__');
        if (lenFunc !== undefined) {
          const len = exec(['call', lenFunc, [operand]]);
          return PyBoolObject(len.value !== 0);
        }
        return trueObject;
      }
      case 'conditional': {
        if (exec(expr[1]) === trueObject) {
          return exec(expr[2]);
        } else {
          return exec(expr[3]);
        }
      }
      case 'not': {
        const truth = exec(expr[1]);
        return PyBoolObject(truth === falseObject);
      }
      case 'and': {
        const left = exec(expr[1]);
        if (left === falseObject) {
          return left;
        } else {
          return exec(expr[2]);
        }
      }
      case 'or': {
        const left = exec(expr[1]);
        if (left === trueObject) {
          return left;
        } else {
          return exec(expr[2]);
        }
      }
      case 'is': {
        const left = exec(expr[1]);
        const right = exec(expr[2]);
        if (left instanceof PyBuiltinObject && right instanceof PyBuiltinObject) {
          return PyBoolObject(left.value === right.value);
        } else {
          return PyBoolObject(left === right);
        }
      }
      case 'assign': {
        const right = exec(expr[2]);
        const left = exec(expr[1]);
        left.set(right);
        return right;
      }
      case 'pass':
        return;
      case 'del':
        exec(expr[1]).delete();
        return;
      case 'return':
        if (object instanceof PyFunctionObject) {
          returnValue = exec(expr[1]);
          returnFlag = true;
        } else {
          throw new SyntaxError("'return' outside function");
        }
        return;
      case 'break':
        if (loopFlag) {
          breakFlag = true;
        } else {
          throw new SyntaxError("'break' outside loop");
        }
        return;
      case 'continue':
        if (loopFlag) {
          continueFlag = true;
        } else {
          throw new SyntaxError("'continue' outside loop");
        }
        return;
      case 'def': {
        if (object instanceof PyFunctionObject) {
          throw new SyntaxError("function cannot be defined inside function");
        }
        const func = new PyFunctionObject(expr[1][1], expr[2].map(x => x[1]), expr[3]);
        object.set(expr[1][1], func);
        return;
      }
      case 'class': {
        if (object instanceof PyFunctionObject) {
          throw new SyntaxError("class cannot be defined inside function");
        }
        const oldObject = object;
        const bases = expr[2].length > 0 ? expr[2].map(x => exec(x)) : [objectType];
        object = new PyTypeObject(expr[1][1], bases);
        for (const stmt of expr[3]) exec(stmt);
        oldObject.set(expr[1][1], object);
        object = oldObject;
        return;
      }
      case 'for': {
        const iterator = exec(expr[1]);
        const iterable = exec(expr[2]);
        let elseFlag = loopFlag = true;
        if (iterable instanceof PyStrObject || iterable instanceof PyListObject) {
          for (let item of iterable.value) {
            if (typeof item === 'string') item = new PyStrObject(item);
            else if (item instanceof Array) item = item[0];
            iterator.set(item);
            for (const stmt of expr[3]) {
              exec(stmt);
              if (continueFlag || breakFlag) break;
            }
            continueFlag = elseFlag = false;
            if (breakFlag) {
              breakFlag = false;
              break;
            }
          }
        } else {
          throw new TypeError(`'${iterable.type.name}' object is not iterable`);
        }
        loopFlag = false;
        if (elseFlag) for (const stmt of expr[4]) exec(stmt);
        return;
      }
      case 'while': {
        let elseFlag = loopFlag = true;
        while (exec(expr[1]) === trueObject) {
          for (const stmt of expr[2]) {
            exec(stmt);
            if (continueFlag || breakFlag) break;
          }
          continueFlag = elseFlag = false;
          if (breakFlag) {
            breakFlag = false;
            break;
          }
        }
        loopFlag = false;
        if (elseFlag) for (const stmt of expr[3]) exec(stmt);
        return;
      }
      case 'if':
        if (exec(expr[1]) === trueObject) {
          for (const stmt of expr[2]) exec(stmt);
          return;
        }
        for (const elif of expr[3]) {
          if (exec(elif[1]) === trueObject) {
            for (const stmt of elif[2]) exec(stmt);
            return;
          }
        }
        for (const stmt of expr[4]) exec(stmt);
        return;
      }
    };
    
    this.output = '';
    this.parse(source);
    for (const stmt of this.ast) exec(stmt);
  },
  
  toString() {
    const display = expr => {
      if (expr instanceof Array) {
        if (expr.length === 0) return '()';
        let car = expr[0] === null ? '' : expr[0] + '';
        const cdr = expr.slice(1);
        switch (car) {
        case 'list':
          cdr[0].unshift(null);
          break;
        case 'if':
          cdr[1].unshift(null); cdr[2].unshift(null); cdr[3].unshift(null);
          break;
        case 'elif': case 'call':
          cdr[1].unshift(null);
          break;
        case 'for':
          cdr[2].unshift(null); cdr[3].unshift(null);
          break;
        case 'while': case 'def': case 'class':
          cdr[1].unshift(null); cdr[2].unshift(null);
          break;
        }
        if (car.length > 0 && cdr.length > 0) car += ' ';
        return `(${car}${cdr.map(display).join(' ')})`;
      } else {
        if (expr === null) {
          return 'null';
        } else if (typeof expr === 'string') {
          return '`' + expr + '`';
        } else {
          return expr.toString();
        }
      }
    };
    if (typeof this.ast === 'undefined') {
      return undefined;
    } else {
      return this.ast.map(display).join('\n');
    }
  },
};
