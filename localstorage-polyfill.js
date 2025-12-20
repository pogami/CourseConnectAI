"use strict";
// Polyfill Buffer for Node environment (needed for worker processes)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}
const buffer = require('buffer');
if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = buffer.Buffer;
}

// Minimal localStorage polyfill for Node/SSR usage.
// Provides getItem/setItem/removeItem/clear/key/length.
if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.getItem !== "function") {
  const store = new Map();

  const polyfill = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
  };

  globalThis.localStorage = polyfill;
}

module.exports = globalThis.localStorage;
"use strict";

// Minimal localStorage polyfill for Node/SSR
const store = new Map();

const localStorage = {
  getItem: (key) => {
    const v = store.get(String(key));
    return v === undefined ? null : v;
  },
  setItem: (key, value) => {
    store.set(String(key), String(value));
  },
  removeItem: (key) => {
    store.delete(String(key));
  },
  clear: () => {
    store.clear();
  },
  key: (index) => {
    const keys = Array.from(store.keys());
    return keys[index] ?? null;
  },
  get length() {
    return store.size;
  },
};

if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.getItem !== "function") {
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorage,
    writable: false,
    configurable: false,
    enumerable: true,
  });
}

