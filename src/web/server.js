#!/usr/bin/env node

/**
 * Simple HTTP Server for PWA
 * Serves static files from public/ directory
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = join(__dirname, '../../public');
const PORT = parseInt(process.env.WEB_PORT || '8080', 10);

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    // Parse URL
    let filePath = req.url === '/' ? '/index.html' : req.url;

    // Remove query string
    filePath = filePath.split('?')[0];

    // Security: prevent directory traversal
    if (filePath.includes('..')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // Full file path
    const fullPath = join(PUBLIC_DIR, filePath);

    // Read file
    const content = await readFile(fullPath);

    // Get MIME type
    const ext = extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Send response
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(content);

    console.log(`[${new Date().toLocaleTimeString()}] 200 ${req.url}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404);
      res.end('Not Found');
      console.log(`[${new Date().toLocaleTimeString()}] 404 ${req.url}`);
    } else {
      res.writeHead(500);
      res.end('Internal Server Error');
      console.error(`[${new Date().toLocaleTimeString()}] 500 ${req.url}:`, error.message);
    }
  }
});

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('StorySplicer Web Server');
  console.log('='.repeat(60));
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${PUBLIC_DIR}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down web server...');
  server.close(() => {
    console.log('Web server stopped');
    process.exit(0);
  });
});
