const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 8092);
const root = path.join(__dirname, 'dist');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

const send = (res, statusCode, body, contentType = 'text/plain; charset=utf-8') => {
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
  });
  res.end(body);
};

const resolveFile = (urlPath) => {
  const pathname = decodeURIComponent(new URL(urlPath, `http://localhost:${port}`).pathname);
  const requestedPath = path.normalize(path.join(root, pathname));

  if (!requestedPath.startsWith(root)) {
    return null;
  }

  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return requestedPath;
  }

  return path.join(root, 'index.html');
};

const server = http.createServer((req, res) => {
  if (!fs.existsSync(root)) {
    send(res, 500, 'Missing web build. Run `npm run build:web` first.');
    return;
  }

  const filePath = resolveFile(req.url || '/');
  if (!filePath || !fs.existsSync(filePath)) {
    send(res, 404, 'Not found');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 500, 'Unable to read file.');
      return;
    }

    send(res, 200, data, contentTypes[path.extname(filePath)] || 'application/octet-stream');
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`SwipeConnect preview running at http://127.0.0.1:${port}`);
});
