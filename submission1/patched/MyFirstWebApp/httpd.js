// import required packages
const fs = require('fs');
const url = require('url');
const http = require('http');

// define constants
const port = 8000;
const host = '127.0.0.1';
const publicDir = './public';
const templateDir = './templates';

// create HTTP server
const server = http.createServer((req, res) => route(req, res));

// run server on the provided port, host and print info message
server.listen(port, host, null, () => {
  console.log(`Server was started at http://${host}:${port}/`);
});

/**
 * Route client request
 *
 * @param req request
 * @param res response
 */
function route(req, res) {
  if (req.url.startsWith('/information')) {
    information(req, res);
  } else {
    staticContent(req, res);
  }
}

/**
 * Send information about client request
 *
 * @param req request
 * @param res response
 */
function information(req, res) {
  try {
    const {reqUrl, path} = parseUri(req, res);
    fs.readFile(templateDir + '/information.template', (err, data) => {
      if (err) {
        console.error(err);
        res.statusCode = 500;
        res.end();
      } else {
        let queries = '';
        for (let param in reqUrl.query) {
          queries += `<li>${param} : ${encodeHtmlEntities(reqUrl.query[param])}</li>`;
        }
        res.statusCode = 200;
        res.end(data.toString()
          .replace('{{method}}', encodeHtmlEntities(req.method))
          .replace('{{path}}', encodeHtmlEntities(path))
          .replace('{{query}}', encodeHtmlEntities(reqUrl.search ?? ''))
          .replace('{{queries}}', queries));
      }
    });
  } catch (e) {
    res.statusCode = 400;
    res.end();
  }
}

/**
 * Send static content
 *
 * @param req request
 * @param res response
 */
function staticContent(req, res) {
  try {
    const {path} = parseUri(req, res);
    if (isFilePath(path)) {
      sendFileResponse(publicDir + path, res, () => sendNotFoundResponse(res, path));
    } else {
      if (path === '/') {
        sendFileResponse(publicDir + '/index.html', res, (err) => {
          console.error(err);
          res.statusCode = 500;
          res.end();
        });
      } else {
        sendFileResponse(publicDir + path + '/index.html', res, () => {
          fs.readdir(publicDir + path, (err, files) => {
            if (err) {
              sendNotFoundResponse(res, path);
            } else {
              let dirContent = '';
              if (files && files.length > 0) {
                files.forEach(file => {
                  dirContent += `<li><a href="${'http://' + host + ':' + port + path + '/' + file}">${file}</a></li>`
                });
              } else {
                dirContent = '<li>Directory is empty!</li>';
              }
              fs.readFile(templateDir + '/dircontent.template', (err, data) => {
                if (err) {
                  console.error(err);
                  res.statusCode = 500;
                  res.end();
                } else {
                  res.statusCode = 200;
                  res.end(data.toString().replace('{{dirContent}}', dirContent));
                }
              });
            }
          });
        });
      }
    }
  } catch (e) {
    res.statusCode = 400;
    res.end();
  }
}

/**
 * Send file response
 *
 * @param path path
 * @param res response
 * @param errCallback function to call when error has occurred
 */
function sendFileResponse(path, res, errCallback) {
  fs.readFile(path, (err, data) => {
    if (err) {
      errCallback(err);
    } else {
      res.statusCode = 200;
      res.end(data);
    }
  });
}

/**
 * Send not found response
 *
 * @param res response
 * @param path path
 */
function sendNotFoundResponse(res, path) {
  fs.readFile(templateDir + '/notfound.template', (err, data) => {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      res.end();
    } else {
      res.statusCode = 404;
      res.end(data.toString().replace('{{message}}', path));
    }
  });
}

/**
 * Parse URI
 *
 * @param req request
 * @returns parsed URI
 */
function parseUri(req) {
  let reqUrl = url.parse(req.url, true);
  let path = decodeURIComponent(reqUrl.pathname);
  return {reqUrl, path};
}

/**
 * Check if the provided path targets to a file
 *
 * @param path path
 * @returns true if path targets to a file or false otherwise
 */
function isFilePath(path) {
  return path.includes('.');
}

/**
 * Encode HTML entities
 *
 * @param input input
 * @returns encoded html input
 */
function encodeHtmlEntities(input) {
  return input.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag]));
}