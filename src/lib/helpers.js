var bcrypt = require('bcrypt');

// Contains generic functions unrelated to a specific component
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

function createHash (string) {
  return new Promise((resolve, reject) => {
    const saltRounds = 10;
    bcrypt.hash(string, saltRounds, function (err, hash) {
      if (err) {
        reject(err);
      }
      resolve(hash);
    });
  });
}

async function compareHash (string1, string2) {
  console.log(string1, string2);
  console.log('Hash should be', await createHash(string1));

  return new Promise((resolve, reject) => {
    try {
      bcrypt.compare(string1, string2, (err, res) => {
        if (res) {
          resolve(200);
        } else {
          reject(400);
        }
      });
    } catch (e) {
      resolve(500);
    }
  });
}

const createResponse = (body, statusCode = 200, error = null) => ({
  body,
  statusCode,
  error
});

function makeURIRequest (uri) {
  return new Promise((resolve, reject) => {
    const options = { method: 'get', uri: uri };
    rp(options)
      .then(function (response) {
        const responseData = createResponse(response);
        resolve(responseData);
      })
      .catch(function (response) {
        const responseData = createResponse(response.body, response.statusCode, response.error);
        reject(responseData);
      });
  });
}

// Make an http request (with a body), uses promises
function makeURIRequestWithBody (uri, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      uri: uri,
      body: data,
      json: true
    };

    rp(options)
      .then(function (response) {
        const responseData = createResponse(response);
        resolve(responseData);
      })
      .catch(function (response) {
        const responseData = createResponse(response.body, response.statusCode, response.error);
        reject(responseData);
      });
  });
}

module.exports = {
  createHash,
  compareHash,
  makeURIRequest,
  makeURIRequestWithBody
};
