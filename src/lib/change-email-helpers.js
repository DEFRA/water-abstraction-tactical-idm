const helpers = require('./helpers');
const { EmailChangeError } = require('../controllers/change-email');
const repos = require('./repos');

/**
 * Checks password which was entered by user
 * @param  {Number}  userId
 * @param  {String}  password
 */
const authenticateUserById = async (userId, password) => {
  const user = await repos.usersRepo.findById(userId);
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
  const { error, rowCount } = repos.usersRepo.updateEmailAddress(userId, newEmail);
  if (error) throw error;
  if (rowCount === 0) throw new EmailChangeError('User does not exist', 500);
};

exports.authenticateUserById = authenticateUserById;
exports.updateEmailAddress = updateEmailAddress;
