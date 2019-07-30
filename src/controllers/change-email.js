const { logger } = require('../logger');
const helpers = require('../lib/change-email-helpers');
const repos = require('../lib/repos');

class EmailChangeError extends Error {
  constructor (message, statusCode) {
    super(message);
    this.name = 'EmailChangeError';
    this.statusCode = statusCode;
  }
}

/**
 * Starts email change process:
 *   Checks number of attempts in last 24hrs
 *   Checks password entered
 *   Creates record in email change verifications table
 */
const startChangeEmailAddress = async (request, h) => {
  try {
    const { userId, password } = request.payload;
    const { rowCount } = await repos.changeEmailRepo.findByUserId(userId);

    if (rowCount > 2) throw new EmailChangeError('Too many email change attempts', 429);

    const isAuthenticated = await helpers.authenticateUserById(userId, password);
    const verificationId = await repos.changeEmailRepo.createEmailChangeRecord(userId, isAuthenticated);

    return h.response({ data: { verificationId, authenticated: isAuthenticated } }).code(200);
  } catch (error) {
    return h.response({ data: null, error }).code(error.statusCode);
  }
};

/**
 * Second step of email change process:
 *   Checks whether email address is already in use
 *   Updates record in email change verifications table with newEmail and code
 */
const createVerificationCode = async (request, h) => {
  try {
    const { email: newEmail, verificationId } = request.params;

    const { rowCount } = await repos.usersRepo.checkEmailAddress(verificationId, newEmail);

    if (rowCount > 0) throw new EmailChangeError('Email address already in use', 409);

    const { err, verificationCode } = await repos.changeEmailRepo.updateEmailChangeRecord(verificationId, newEmail);
    if (err) throw err;

    return h.response({ data: { verificationCode }, error: null }).code(200);
  } catch (error) {
    logger.error(error);
    return h.response({ data: null, error }).code(error.statusCode);
  }
};

/**
 * Final step of email change process:
 *   Checks whether there is a record with the code provided that is > 24hrs old
 *   Update the user_name in the users table
 */
const checkVerificationCode = async (request, h) => {
  const { userId, verificationCode } = request.params;

  try {
    const { err, newEmail } = await repos.changeEmailRepo.findRecordWithVerificationCode(userId, verificationCode);
    if (err) throw err;
    await helpers.updateEmailAddress(userId, newEmail);

    return h.response({ data: { newEmail }, error: null }).code(200);
  } catch (error) {
    return h.response({ data: null, error }).code(error.statusCode);
  }
};

module.exports = {
  EmailChangeError,
  startChangeEmailAddress,
  createVerificationCode,
  checkVerificationCode
};
