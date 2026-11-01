/**
 * Standalone Node.js HTTP Server for Gatherly AI.
 * 
 * Runs `/api/chat` and `/api/health` server-side and serves static assets from `/dist`.
 * Zero additional external runtime dependencies.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';
import healthHandler from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env locally if present and not already loaded
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value.trim();
      }
    });
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }
}

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // API Routes
  if (pathname === '/api/chat') {
    if (req.method === 'POST') {
      let bodyData = '';
      req.on('data', chunk => {
        bodyData += chunk;
        if (bodyData.length > 64 * 1024) {
          res.statusCode = 413;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Payload too large.' }));
          req.destroy();
        }
      });
      req.on('end', async () => {
        try {
          req.body = bodyData ? JSON.parse(bodyData) : {};
        } catch {
          req.body = bodyData;
        }
        await chatHandler(req, res);
      });
      return;
    }
    return chatHandler(req, res);
  }

  if (pathname === '/api/health') {
    return healthHandler(req, res);
  }

  // Static Assets from dist/
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  // Prevent directory traversal attacks
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(normalized, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: rewrite to /index.html
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(content);
      });
      return;
    }

    const ext = path.extname(normalized).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    fs.createReadStream(normalized).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Gatherly AI server running on http://localhost:${PORT}`);
  console.log(`Gemini status: ${process.env.GEMINI_API_KEY ? 'Configured (' + (process.env.GEMINI_MODEL || 'gemini-3.8-flash') + ')' : 'No API key'}`);
});

export default server;
