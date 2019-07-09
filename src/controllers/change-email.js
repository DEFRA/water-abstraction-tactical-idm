const moment = require('moment');
const { logger } = require('../logger');
const helpers = require('../lib/change-email-helpers');

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
    const { rowCount } = await helpers.getRecordsByUserId(userId);

    if (rowCount > 2) throw new EmailChangeError('Too many email change attempts', 429);

    const isAuthenticated = await helpers.authenticateUserById(userId, password);
    const { email_change_verification_id: verificationId, authenticated } = await helpers.createEmailChangeRecord(userId, isAuthenticated);
    return h.response({ data: { verificationId, authenticated } }).code(200);
  } catch (error) {
    logger.error(error);
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

    const { data: checkEmailResults } = await helpers.usersRepo.checkEmailAddress(verificationId, newEmail);

    if (checkEmailResults.length > 0) throw new EmailChangeError('Email address already in use', 409);

    const filter = {
      email_change_verification_id: verificationId,
      date_created: { $gte: moment().subtract(1, 'days').toISOString() },
      authenticated: true
    };
    const data = {
      new_email_address: newEmail,
      verification_code: helpers.createDigitCode()
    };

    const { rowCount, verification_code: verificationCode } = await helpers.emailChangeRepo.update(filter, data);

    if (rowCount !== 1) {
      throw new EmailChangeError(`Email change verification record update error, id:${verificationId}`, 500);
    }
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
    const filter = {
      user_id: userId,
      date_created: { $gte: moment().subtract(1, 'days').toISOString() },
      verification_code: verificationCode
    };
    const data = { date_verified: moment().format('YYYY-MM-DD HH:mm:ss') };

    const { rowCount, new_email_address: newEmail } = await helpers.emailChangeRepo.update(filter, data);

    if (rowCount !== 1) throw new EmailChangeError('Email change verification code has expired or is incorrect', 409);

    await helpers.updateEmailAddress(userId, newEmail);

    return h.response({ data: { newEmail }, error: null }).code(200);
  } catch (error) {
    logger.error(error);
    return h.response({ data: null, error }).code(error.statusCode);
  }
};

module.exports = {
  EmailChangeError,
  startChangeEmailAddress,
  createVerificationCode,
  checkVerificationCode
};
