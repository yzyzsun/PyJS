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
      PyBuiltinObject, PyIntObject, PyFloatObject, PyStrObject, PyListObject, PyDictObject, PySetObject,
      noneObject, falseObject, trueObject,
    } = require('./object');
    const {
      SyntaxError, TypeError, NameError, AttributeError,
    } = require('./error');
    
    // TODO: form built-in map
    const builtins = new Map();
    const globals = new Map();
    let object = globals;
    let returnValue = noneObject;
    
    let loopFlag = false;
    let elseFlag = false;
    let breakFlag = false;
    let continueFlag = false;
    
    const exec = expr => {
      switch (expr[0]) {
      case 'identifier':
        return {
          get() {
            if (object.has(expr[1])) {
              return object.get(expr[1]);
            } else if (globals.has(expr[1])) {
              return globals.get(expr[1]);
            } else if (builtins.has(expr[1])) {
              return builtins.get(expr[1]);
            } else {
              throw new NameError(`name '${expr[1]}' is not defined`);
            }
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
        return expr[1] ? trueObject : falseObject;
      case 'str':
        return new PyStrObject(expr[1]);
      case 'list':
        return new PyListObject(expr[1]);
      case 'dict':
        return new PyDictObject(expr[1]);
      case 'set':
        return new PySetObject(expr[1]);
      case 'NoneType':
        return noneObject;
      case 'attributeref': {
        const primary = exec(expr[1]);
        const identifier = expr[2][1];
        return {
          get() {
            const attribute = primary.get(identifier);
            if (typeof attribute === 'function') {
              return attribute.bind(null, primary.value);
            } else if (attribute instanceof PyFunctionObject) {
              return Object.assign({object: primary}, attribute);
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
      case 'subscription':
        return {
          get() {
            return exec(require('./parser').call(expr[1], '__getitem__', [expr[2]]));
          },
          set(value) {
            return exec(require('./parser').call(expr[1], '__setitem__', [expr[2], value]));
          },
          delete() {
            return exec(require('./parser').call(expr[1], '__delitem__', [expr[2]]));
          },
        };
      case 'call': {
        let func = exec(expr[1]);
        let argv = expr[2].map(x => exec(x));
        if (typeof func === 'function') {
          const ret = func(argv.map(x => x.value));
          // TODO: properly wrap native value to PyBuiltinObject
          return wrap(ret);
        } else if (func instanceof PyFunctionObject) {
          const params = func.parameters;
          if (func.hasOwnProperty('object')) argv.unshift(func.object);
          if (params.length !== argv.length) {
            throw new TypeError(`${func.funcname}() take ${params.length} arguments but ${argv.length} was given`);
          }
          func.locals = new Map();
          for (const i = 0; i < params.length; i++) {
            func.locals.set(params[i], argv[i]);
          }
          const oldObject = object;
          object = func;
          for (const stmt of func.statements) exec(stmt);
          object = oldObject;
          const ret = returnValue;
          returnValue = noneObject;
          return ret;
        } else {
          throw new TypeError(`'${func.type.name}' object is not callable`);
        }
      }
      case 'truth': {
        const boolFunc = expr[1].get('__bool__');
        if (boolFunc !== undefined) {
          const bool = exec(['call', boolFunc, [expr[1]]]);
          if (bool.type.name === 'bool') {
            return bool;
          } else {
            throw new TypeError(`__bool__ should return bool, returned ${bool.type.name}`);
          }
        }
        const lenFunc = expr[1].get('__len__');
        if (lenFunc !== undefined) {
          const len = exec(['call', lenFunc, [expr[1]]]);
          if (len === 0) {
            return falseObject;
          } else {
            return trueObject;
          }
        }
        return trueObject;
      }
      case 'not': {
        const truth = exec(['truth', exec(expr[1])]);
        return truth === trueObject ? falseObject : trueObject;
      }
      case 'and': {
        const left = exec(expr[1]);
        if (exec(['truth', left]) === falseObject) {
          return left;
        } else {
          return exec(expr[2]);
        }
      }
      case 'or': {
        const left = exec(expr[1]);
        if (exec(['truth', left]) === trueObject) {
          return left;
        } else {
          return exec(expr[2]);
        }
      }
      case 'is': {
        const left = exec(expr[1]);
        const right = exec(expr[2]);
        if (left instanceof PyNumericObject && right instanceof PyNumericObject) {
          return left.value === right.value;
        } else if (left instanceof PyStrObject && right instanceof PyStrObject) {
          return left.value === right.value;
        } else {
          return left === right;
        }
      }
      case 'assign': {
        const right = exec(expr[2]);
        const left = exec(expr[1]);
        left.set(right);
        return right;
      }
      case 'pass':
        break;
      case 'del':
        exec(expr[1]).delete();
        break;
      case 'return':
        if (object instanceof PyFunctionObject) {
          returnValue = exec(expr[1]);
        } else {
          throw new SyntaxError("'return' outside function");
        }
        break;
      case 'break':
        if (loopFlag) {
          breakFlag = true;
        } else {
          throw new SyntaxError("'break' outside loop");
        }
        break;
      case 'continue':
        if (loopFlag) {
          continueFlag = true;
        } else {
          throw new SyntaxError("'continue' outside loop");
        }
        break;
      case 'def': {
        if (object instanceof PyFunctionObject) {
          throw new SyntaxError("function cannot be defined inside function");
        }
        const func = new PyFunctionObject(expr[1][1], expr[2].map(x => x[1]), expr[3]);
        object.set(expr[1][1], func);
        break;
      }
      case 'class': {
        if (object instanceof PyFunctionObject) {
          throw new SyntaxError("class cannot be defined inside function");
        }
        const oldObject = object;
        object = new PyTypeObject(expr[1][1], expr[2].map(x => exec(x)));
        for (const stmt of expr[3]) exec(stmt);
        oldObject.set(expr[1][1], object);
        object = oldObject;
        break;
      }
      case 'for': {
        const iterator = exec(expr[1]);
        const iterable = exec(expr[2]);
        loopFlag = elseFlag = true;
        if (iterable instanceof PyStrObject || iterable instanceof PyListObject ||
            iterable instanceof PyDictObject || iterable instanceof PySetObject) {
          for (const item of iterable.value) {
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
        if (elseFlag) {
          for (const stmt of expr[3]) exec(stmt);
          elseFlag = false;
        }
        return;
      }
      case 'while':
        loopFlag = elseFlag = true;
        while (exec(['truth', exec(expr[1])])) {
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
        if (elseFlag) {
          for (const stmt of expr[3]) exec(stmt);
          elseFlag = false;
        }
        return;
      case 'if':
        if (exec(['truth', exec(expr[1])]) === trueObject) {
          for (const stmt of expr[2]) exec(stmt);
          return;
        }
        for (const elif of expr[3]) {
          if (exec(['truth', exec(elif[1])]) === trueObject) {
            for (const stmt of elif[2]) exec(stmt);
            return;
          }
        }
        for (const stmt of expr[4]) exec(stmt);
        return;
      }
    };
    
    this.parse(source);
    for (const stmt of this.ast) exec(stmt);
  },
  
  toString() {
    const displayExpr = expr => {
      if (expr instanceof Array) {
        if (expr.length == 0) return '()';
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
        return `(${car}${cdr.map(displayExpr).join(' ')})`;
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
      return this.ast.map(displayExpr).join('\n');
    }
  },
};
