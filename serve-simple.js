/**
 * Node.js만 있으면 됨 (npm/npx 불필요)
 * 실행: node serve-simple.js
 * 브라우저: http://127.0.0.1:5173/
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = Number(process.env.PORT) || 5173;
const ROOT = path.resolve(__dirname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function safeFilePath(urlPath) {
  let rel = decodeURIComponent((urlPath || '/').split('?')[0]);
  rel = rel.replace(/^\/+/, '');
  if (!rel) rel = 'index.html';
  const joined = path.join(ROOT, rel);
  const resolved = path.resolve(joined);
  const rootWithSep = ROOT + path.sep;
  if (resolved !== ROOT && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }
  const file = safeFilePath(req.url || '/');
  if (!file) {
    res.writeHead(403);
    res.end('403');
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }
    fs.readFile(file, (e, data) => {
      if (e) {
        res.writeHead(500);
        res.end();
        return;
      }
      const ext = path.extname(file).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.setHeader('Content-Length', data.length);
      res.writeHead(200);
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' in use. Try: set PORT=8080 && node serve-simple.js');
  } else {
    console.error(e.message);
  }
  process.exit(1);
});

function isLanIPv4(net) {
  return (net.family === 'IPv4' || net.family === 4) && !net.internal;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  BMM — this PC: http://127.0.0.1:' + PORT + '/');
  const nets = os.networkInterfaces();
  let any = false;
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (isLanIPv4(net)) {
        console.log('  Same WiFi / LAN: http://' + net.address + ':' + PORT + '/');
        any = true;
      }
    }
  }
  if (!any) {
    console.log('  (No LAN IPv4 found — check WiFi / firewall.)');
  }
  console.log('  Stop: Ctrl+C');
  console.log('');
});
