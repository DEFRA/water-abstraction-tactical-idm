var bcrypt = require('bcrypt');

const util = require('util');

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
  return new Promise((resolve, reject) => {
    bcrypt.compare(string1, string2, (err, res) => {
      if (err || !res) {
        return reject(new Error(400));
      }
      return resolve(200);
    });
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

/**
 * Generates a random digit of the specified length (default length = 6)
 * @param {Number} length - the length of the random code
 * @return {String} - the random code
 */
const createDigitCode = (length = 6) => {
  const addFactor = Math.pow(10, length - 1);
  const multiplyBy = addFactor * 9;

  return Math.floor(addFactor + Math.random() * multiplyBy);
};

/**
 * Compares password with a hash
 * @param {String} password - plain text password
 * @param {String} hash
 * @return {Promise<Boolean>} resolves with boolean true if password OK
 */
const testPassword = util.promisify(bcrypt.compare);

module.exports = {
  createHash,
  compareHash,
  makeURIRequest,
  makeURIRequestWithBody,
  createDigitCode,
  testPassword
};
