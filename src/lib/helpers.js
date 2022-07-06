const bcrypt = require('bcryptjs')

const util = require('util')

function createHash (string) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, function (saltErr, salt) {
      if (saltErr) {
        reject(saltErr)
      }
      bcrypt.hash(string, salt, function (hashErr, hash) {
        if (hashErr) {
          reject(hashErr)
        }
        resolve(hash)
      })
    })
  })
}

/**
 * Generates a random digit of the specified length (default length = 6)
 * @param {Number} length - the length of the random code
 * @return {String} - the random code
 */
const createDigitCode = (length = 6) => {
  const addFactor = Math.pow(10, length - 1)
  const multiplyBy = addFactor * 9

  return Math.floor(addFactor + Math.random() * multiplyBy)
}

/**
 * Compares password with a hash
 * @param {String} password - plain text password
 * @param {String} hash
 * @return {Promise<Boolean>} resolves with boolean true if password OK
 */
const testPassword = util.promisify(bcrypt.compare)

module.exports = {
  createHash,
  createDigitCode,
  testPassword
}
