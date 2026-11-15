// Minimal static file server (no dependencies) for Railway / local use. Serves this folder on $PORT (default 3000).
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname, port = process.env.PORT || 3000;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root) || /\/(\.git|tests|node_modules)\//.test(file + '/') ) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(buf);
  });
}).listen(port, '0.0.0.0', () => console.log('Pelican Companion on :' + port));
