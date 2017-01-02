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
  
  exec(source) {
    require('./parser').parse(this.preprocess(source));
    this.ast = require('./parser').ast;
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
