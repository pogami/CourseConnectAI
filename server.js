const path = require('path');
// Ensure a working localStorage in Node/SSR
require('./localstorage-polyfill');
// Ensure Buffer is available globally
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
function getPortFromArgs() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' && args[i + 1]) {
      return args[i + 1];
    }
    if (arg.startsWith('--port=')) {
      return arg.split('=')[1];
    }
  }
  return null;
}

// Provide a real backing file for Next's node localStorage shim to avoid warnings
if (!process.env.NEXT_PRIVATE_LOCAL_STORAGE_FILE) {
  process.env.NEXT_PRIVATE_LOCAL_STORAGE_FILE = '/tmp/next-localstorage';
}

// Ensure worker processes spawned by Next also preload the polyfill
const polyfillPath = path.join(__dirname, 'localstorage-polyfill.js');
if (!process.execArgv.includes('--require') || !process.execArgv.includes(polyfillPath)) {
  process.execArgv.push('--require', polyfillPath);
}
const existingNodeOptions = process.env.NODE_OPTIONS || '';
if (!existingNodeOptions.includes(polyfillPath)) {
  process.env.NODE_OPTIONS = `${existingNodeOptions} --require ${polyfillPath}`.trim();
}

const port = process.env.PORT || getPortFromArgs() || 9002;
const useTurbopack = process.argv.includes('--turbopack') || process.env.TURBOPACK === 'true';

// Initialize Next.js app
const app = next({ dev, hostname, port, turbo: useTurbopack });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl).catch((err) => {
        console.error('Error handling request:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Internal Server Error');
        }
      });
    } catch (err) {
      console.error('Error parsing request:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Internal Server Error');
      }
    }
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Server running on port ${port}`);
  });
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err);
  process.exit(1);
});