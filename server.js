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

const port = process.env.PORT || getPortFromArgs() || 9002;
const useTurbopack = process.argv.includes('--turbopack') || process.env.TURBOPACK === 'true';

// Initialize Next.js app
const app = next({ dev, hostname, port, turbo: useTurbopack });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Server running on port ${port}`);
  });
});