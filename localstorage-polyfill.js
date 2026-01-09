// localStorage polyfill for Node.js/SSR
// Provides a simple in-memory storage implementation

if (typeof global !== 'undefined' && typeof global.localStorage === 'undefined') {
  const storage = new Map();
  
  global.localStorage = {
    getItem: (key) => {
      return storage.get(String(key)) || null;
    },
    setItem: (key, value) => {
      storage.set(String(key), String(value));
    },
    removeItem: (key) => {
      storage.delete(String(key));
    },
    clear: () => {
      storage.clear();
    },
    get length() {
      return storage.size;
    },
    key: (index) => {
      const keys = Array.from(storage.keys());
      return keys[index] || null;
    }
  };
}

// Also set for window if in browser-like environment
if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
  window.localStorage = global.localStorage;
}

module.exports = global.localStorage;


