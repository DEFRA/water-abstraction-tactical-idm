const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const moment = require('moment');
const uuid = require('uuid/v4');
const { EmailChangeError } = require('../../controllers/change-email');
const { createDigitCode } = require('../helpers');

class ChangeEmailRepository extends Repository {
  findByUserId (userId) {
    return this.find({
      user_id: userId,
      date_created: { $gte: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss') }
    });
  }
  async createEmailChangeRecord (userId, authenticated) {
    const data = {
      email_change_verification_id: uuid(),
      user_id: userId,
      new_email_address: null,
      authenticated,
      verification_code: null,
      date_created: moment().format('YYYY-MM-DD HH:mm:ss'),
      date_verified: null
    };
    const { rows: [{ email_change_verification_id: verificationId }] } = await this.create(data);
    return verificationId;
  }
  async updateEmailChangeRecord (verificationId, newEmail) {
    const filter = {
      email_change_verification_id: verificationId,
      date_created: { $gte: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss') },
      authenticated: true
    };
    const data = {
      new_email_address: newEmail,
      verification_code: createDigitCode()
    };

    const { rowCount, rows: [{ verification_code: verificationCode }] } = await this.update(filter, data);

    if (rowCount !== 1) {
      const err = new EmailChangeError(`Email change verification record update error, id:${verificationId}`, 500);
      return err;
    }
    return verificationCode;
  }
  async findRecordWithVerificationCode (userId, verificationCode) {
    const filter = {
      user_id: userId,
      date_created: { $gte: moment().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss') },
      verification_code: verificationCode
    };
    const data = { date_verified: moment().format('YYYY-MM-DD HH:mm:ss') };

    const { rowCount, rows: [{ new_email_address: newEmail }] } = await this.update(filter, data);

    if (rowCount !== 1) {
      const err = new EmailChangeError('Email change verification code has expired or is incorrect', 409);
      return err;
    }

    return newEmail;
  }
};

module.exports = ChangeEmailRepository;
