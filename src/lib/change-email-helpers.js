const helpers = require('../lib/helpers');
const uuid = require('uuid/v4');
const moment = require('moment');
const { pool } = require('../lib/connectors/db');
const DB = require('./connectors/db');
const { EmailChangeError } = require('../controllers/change-email');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');

class UsersRespository extends Repository {
  findById (userId) {
    const user = this.find({ user_id: userId });
    return user.data[0];
  }
  checkEmailAddress (verificationId, newEmail) {
    const query = `SELECT user_name FROM idm.users u
      JOIN (
        SELECT application
        FROM idm.users u
        JOIN idm.change_email_verification v ON v.user_id = u.user_id
        WHERE verification_id=$1
      ) v ON v.application=u.application
      WHERE u.user_name=$2`;

    return DB.query(query, [verificationId, newEmail]);
  }
};

const usersRepo = new UsersRespository({
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

const getEmailChangeRecordById = async verificationId => {
  const result = await emailChangeRepo.find({ email_change_verification_id: verificationId });
  if (result.rowCount !== 1) {
    throw new EmailChangeError(`Email change record does not exist, id: ${verificationId}`, 404);
  }
  return result.data[0];
};

const getRecordsByUserId = async userId => {
  return emailChangeRepo.find({
    user_id: userId,
    date_created: { $gte: moment().subtract(1, 'days').toISOString() }
  });
};

const authenticateUserById = async (userId, password) => {
  const user = await usersRepo.findById(userId);
  if (user) {
    return helpers.compareHash(password, user.password);
  }
  throw new Error('User does not exist');
};

const updateEmailAddress = async (userId, newEmail) => {
  const { error, rowCount } = usersRepo.update({ user_id: userId }, { user_name: newEmail });
  if (error) throw error;
  if (rowCount === 0) throw new EmailChangeError('User does not exist', 500);
};

const updateIDM = async (userId, newEmail, application) => {
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
  getEmailChangeRecordById,
  getRecordsByUserId,
  authenticateUserById,
  updateEmailAddress,
  updateIDM,
  createDigitCode
};
