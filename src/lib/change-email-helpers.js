const helpers = require('../lib/helpers');
const uuid = require('uuid/v4');
const moment = require('moment');
const { pool } = require('../lib/connectors/db');
const { EmailChangeError, checkEmailAddressInIDM } = require('../controllers/change-email');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');

const usersRepo = new Repository({
  connection: pool,
  table: 'idm.users',
  primaryKey: 'user_id'
});

const emailChangeRepo = new Repository({
  connection: pool,
  table: 'idm.email_change_verification',
  primaryKey: 'email_change_verification_id'
});

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

const getRecordsByUserId = async userId => {
  return emailChangeRepo.find({
    user_id: userId,
    date_created: { $gte: moment().subtract(1, 'days').toISOString() }
  });
};

const authenticateUserById = async (userId, password) => {
  const user = usersRepo.find({ user_id: userId });
  if (user) {
    return helpers.compareHash(password, user.password);
  }
  return 404;
};

const updateEmailAddress = async (userId, newEmail) => {
  const { error, rowCount } = usersRepo.update({ user_id: userId }, { user_name: newEmail });
  if (error) throw error;
  if (rowCount === 0) throw new EmailChangeError('User does not exist', 500);
};

const updateIDM = async (userId, newEmail, application) => {
  // Check if email address already exists
  const { rowCount } = await checkEmailAddressInIDM(userId, newEmail, application);

  if (rowCount > 0) throw new EmailChangeError('Email address already in use', 404);

  const filter = {
    user_id: userId
  };
  const data = { user_name: newEmail };

  // update user email
  await helpers.updateEmailAddress(filter, data);
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
  updateIDM,
  createDigitCode
};
