const moment = require('moment');
const idm = require('../lib/idm');
const { logger } = require('../logger');
const helpers = require('../lib/change-email-helpers');
const { pool } = require('../lib/connectors/db');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');

const repo = new Repository({
  connection: pool,
  table: 'idm.email_change_verification',
  primaryKey: 'email_change_verification_id'
});

class EmailChangeError extends Error {
  constructor (message, statusCode) {
    super(message);
    this.name = 'EmailChangeError';
    this.statusCode = statusCode;
  }
}

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

const checkEmailAddressInIDM = async (userId, newEmail, application) => {
  const result = await idm.getUserByUsername(newEmail, application);
  return result.data[0];
};

const createVerificationCode = async (request, h) => {
  try {
    const { userId, email: newEmail, verificationId, application } = request.params;

    const { rowCount } = await checkEmailAddressInIDM(userId, newEmail, application);

    if (rowCount > 0) throw new EmailChangeError('Email address already in use', 409);

    const filter = {
      email_change_verification_id: verificationId,
      date_created: { $gte: moment().subtract(1, 'days').toISOString() },
      authenticated: true
    };
    const data = {
      new_email_address: newEmail,
      verification_code: helpers.createDigitCode()
    };

    const { rowCount: updateRowCount, verification_code: verificationCode } = await repo.update(filter, data);

    if (updateRowCount !== 1) {
      throw new EmailChangeError(`Email change verification record update error, id:${verificationId}`, 500);
    }
    return h.response({ data: { verificationCode }, error: null }).code(200);
  } catch (error) {
    logger.error(error);
    return h.response({ data: null, error }).code(error.statusCode);
  }
};

const checkVerificationCode = async (request, h) => {
  const { userId, verificationCode, application } = request.params;

  try {
    const filter = {
      user_id: userId,
      date_created: { $gte: moment().subtract(1, 'days').toISOString() },
      verification_code: verificationCode
    };
    const data = { date_verified: moment().format('YYYY-MM-DD HH:mm:ss') };

    const { rowCount, new_email_address: newEmail } = await repo.update(filter, data);

    if (rowCount !== 1) throw new EmailChangeError('Email change verification code has expired or is incorrect', 409);

    await helpers.updateIDM(userId, newEmail, application);

    return h.response({ data: { newEmail }, error: null }).code(200);
  } catch (error) {
    logger.error(error);
    return h.response({ data: null, error }).code(error.statusCode);
  }
};

module.exports = {
  repo,
  EmailChangeError,
  startChangeEmailAddress,
  checkEmailAddressInIDM,
  createVerificationCode,
  checkVerificationCode
};
