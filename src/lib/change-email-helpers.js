const helpers = require('../lib/helpers');
const uuid = require('uuid/v4');
const moment = require('moment');
const { pool } = require('../lib/connectors/db');
const { EmailChangeError } = require('../controllers/change-email');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const UsersRepository = require('./repos/users-repo');

const usersRepo = new UsersRepository({
  connection: pool,
  table: 'idm.users',
  primaryKey: 'user_id'
});

const emailChangeRepo = new Repository({
  connection: pool,
  table: 'idm.email_change_verification',
  primaryKey: 'email_change_verification_id'
});

/**
 * Create record in email change verification table
 * @param  {Number}  userId
 * @param  {Boolean}  authenticated whether or not the user entered the correct password
 */
const createEmailChangeRecord = async (userId, authenticated) => {
  const data = {
    email_change_verification_id: uuid(),
    user_id: userId,
    new_email_address: null,
    authenticated,
    verification_code: null,
    date_created: moment().format('YYYY-MM-DD HH:mm:ss'),
    date_verified: null
  };
  return emailChangeRepo.create(data);
};

/**
 * Get email change record by user_id
 * @param  {Number}  userId
 */
const getRecordsByUserId = async userId => {
  return emailChangeRepo.find({
    user_id: userId,
    date_created: { $gte: moment().subtract(1, 'days').toISOString() }
  });
};

/**
 * Checks password which was entered by user
 * @param  {Number}  userId
 * @param  {String}  password
 */
const authenticateUserById = async (userId, password) => {
  const user = await usersRepo.findById(userId);
  if (user) {
    return helpers.compareHash(password, user.password);
  }
  throw new Error('User does not exist');
};

/**
 * Update email address in users table
 * @param  {Number}  userId
 * @param  {String}  newEmail
 */
const updateEmailAddress = async (userId, newEmail) => {
  const filter = { user_id: userId };
  const data = { user_name: newEmail };

  const { error, rowCount } = await usersRepo.update(filter, data);
  if (error) throw error;
  if (rowCount === 0) throw new EmailChangeError('User does not exist', 500);
};

/**
 * Generates a string of random digits of the specified length
 * (default 6)
 * @see {@link http://fiznool.com/blog/2014/11/16/short-id-generation-in-javascript/}
 * @param {Number} length - the length of the random code
 * @return {String} - the random code
 */
function createDigitCode (length = 6) {
  const addFactor = Math.pow(10, length - 1);
  const multiplyBy = addFactor * 9;

  return Math.floor(addFactor + Math.random() * multiplyBy);
}

module.exports = {
  usersRepo,
  emailChangeRepo,
  createEmailChangeRecord,
  getRecordsByUserId,
  authenticateUserById,
  updateEmailAddress,
  createDigitCode
};
