const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const moment = require('moment');
const { pick } = require('lodash');
const uuid = require('uuid/v4');
const { createDigitCode } = require('../helpers');
const { getYesterday, getNow } = require('./date-helpers');

class ChangeEmailRepository extends Repository {
  findByUserId (userId) {
    return this.find({
      user_id: userId,
      date_created: { $gte: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss') }
    });
  }
  async createEmailChangeRecord (userId, authenticated, refDate) {
    const data = {
      email_change_verification_id: uuid(),
      user_id: userId,
      new_email_address: null,
      authenticated,
      verification_code: null,
      date_created: getNow(refDate),
      date_verified: null
    };
    const { rows: [{ email_change_verification_id: verificationId }] } = await this.create(data);
    return verificationId;
  }

  /**
   * Updates the email change verification record with a generated
   * random verification code and the desired new email address
   * @param  {String}  verificationId - email_change_verification_id GUID
   * @param  {String}  newEmail       - the new email address
   * @return {Promise<String>} resolves with code on success
   */
  async updateEmailChangeRecord (verificationId, newEmail, refDate) {
    const verificationCode = createDigitCode();

    const filter = {
      email_change_verification_id: verificationId,
      date_created: { $gte: getYesterday(refDate) },
      authenticated: true,
      verification_code: null
    };
    const data = {
      new_email_address: newEmail.trim().toLowerCase(),
      verification_code: verificationCode
    };

    const { rowCount } = await this.update(filter, data);

    return rowCount ? verificationCode : undefined;
  }

  /**
   * Finds a valid email change record for the supplied user ID and security
   * code.
   * @param  {Number}  userId           - the user ID from users table
   * @param  {String}  verificationCode - 6 digit security code
   * @return {Promise<Object>}            returns 1 record if found
   */
  async findOneByVerificationCode (userId, verificationCode, refDate) {
    const filter = {
      user_id: userId,
      verification_code: verificationCode,
      date_created: { $gte: getYesterday(refDate) },
      date_verified: null,
      attempts: {
        $lt: 3
      },
      authenticated: true
    };
    const { rows: [row] } = await this.find(filter);
    return row;
  }

  /**
   * Increments attempt counter.  This could affect multiple records
   * as we don't know which row they are attempting to verify
   * @param  {Number} userId
   * @return {<Promise>}
   */
  incrementAttemptCounter (userId) {
    const query = `UPDATE idm.email_change_verification
      SET attempts=attempts+1
      WHERE user_id=$1
        AND date_verified IS NULL
        AND date_created >= NOW() - INTERVAL '1 DAY'`;
    const params = [ userId ];
    return this.dbQuery(query, params);
  }

  /**
   * Sets the date verified for the supplied email change record
   * @param  {Object} row - an email change record row
   * @return {<Promise>}
   */
  updateDateVerified (row, refDate) {
    const filter = pick(row, 'email_change_verification_id');
    const data = { date_verified: getNow(refDate) };
    return this.update(filter, data);
  }
};

module.exports = ChangeEmailRepository;
