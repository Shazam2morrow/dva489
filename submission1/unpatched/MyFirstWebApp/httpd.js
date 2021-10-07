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
  let reqUrl = url.parse(req.url, true);
  let path = decodeURIComponent(reqUrl.pathname);
  fs.readFile(templateDir + '/information.template', (err, data) => {
    if (err) {
      throw err;
    } else {
      let queries = '';
      for (let param in reqUrl.query) {
        queries += `<li>${param} : ${reqUrl.query[param]}</li>`;
      }
      res.statusCode = 200;
      res.end(data.toString().replace('{{method}}', req.method)
        .replace('{{path}}', path)
        .replace('{{query}}', reqUrl.search ?? '')
        .replace('{{queries}}', queries));
    }
  });
}

/**
 * Send static content
 *
 * @param req request
 * @param res response
 */
function staticContent(req, res) {
  let reqUrl = url.parse(req.url, true);
  let path = decodeURIComponent(reqUrl.pathname);
  if (isFilePath(path)) {
    sendFileResponse(publicDir + path, res, (err) => {
      throw err
    });
  } else {
    if (path === '/') {
      sendFileResponse(publicDir + '/index.html', res, (err) => {
        throw err
      });
    } else {
      sendFileResponse(publicDir + path + '/index.html', res, () => {
        fs.readdir(publicDir + path, (err, files) => {
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
              throw err;
            } else {
              res.statusCode = 200;
              res.end(data.toString().replace('{{dirContent}}', dirContent));
            }
          });
        });
      });
    }
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
 * Check if the provided path targets to a file
 *
 * @param path path
 * @returns true if path targets to a file or false otherwise
 */
function isFilePath(path) {
  return path.includes('.');
}