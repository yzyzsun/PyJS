/**
 * Created by yzyzsun on 2017/1/1.
 */

'use strict';

class NameError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NameError';
  }
}

class AttributeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AttributeError';
  }
}

class IndexError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IndexError';
  }
}

class KeyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KeyError';
  }
}

module.exports = {
  NameError, AttributeError, IndexError, KeyError,
};
