// serve-dist.mjs — tiny SPA-aware static server for dist/, on :8899.
//
//   node scripts/serve-dist.mjs &
//
// Exists because scripts/a11y.mjs --local and scripts/shots.mjs --local need
// /play and other client-routed paths to resolve, and `python3 -m http.server`
// 404s them (no SPA fallback), which silently turns an audit into a run
// against the marketing shell instead of the app.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain',
  '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, url);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) f = path.join(ROOT, 'index.html');   // SPA fallback
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(8899, () => console.log('dist served on http://localhost:8899'));
