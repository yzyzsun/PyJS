/**
 * Created by yzyzsun on 2017/1/1.
 */

'use strict';

class SyntaxError {
  constructor(message) {
    this.name = 'SyntaxError';
    this.message = message;
  }
}

class TypeError {
  constructor(message) {
    this.name = 'TypeError';
    this.message = message;
  }
}

class NameError {
  constructor(message) {
    this.name = 'NameError';
    this.message = message;
  }
}

class AttributeError {
  constructor(message) {
    this.name = 'AttributeError';
    this.message = message;
  }
}

module.exports = {
  SyntaxError, TypeError, NameError, AttributeError,
};
