const controller = require('../../src/controllers/change-email');
const helpers = require('../../src/lib/change-email-helpers');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { logger } = require('../../src/logger');

const request = {
  payload: {
    userId: 123,
    password: 'test-password'
  },
  params: {
    userId: 123,
    email: 'new-email@domain.com',
    application: 'test-application',
    verificationId: 'asdf-9876-qwer'
  }
};

const code = sandbox.stub();
const h = {
  response: sandbox.stub().returns({ code })
};

experiment('change email controller', async () => {
  beforeEach(async () => {
    sandbox.stub(helpers.emailChangeRepo, 'update');
    sandbox.stub(helpers.usersRepo, 'findById');
    sandbox.stub(helpers.usersRepo, 'checkEmailAddress');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => sandbox.restore());

  experiment('startChangeEmailAddress', async () => {
    beforeEach(async () => {
      sandbox.stub(helpers, 'getRecordsByUserId');
      sandbox.stub(helpers, 'createEmailChangeRecord').resolves({
        email_change_verification_id: '1df3-jdf6-f2id',
        authenticated: true });
      sandbox.stub(helpers, 'authenticateUserById');
    });

    afterEach(async () => sandbox.restore());

    test('throw error if more than 2 attempts to change password in previous 24 hrs', async () => {
      helpers.getRecordsByUserId.returns({ rowCount: 3 });
      await controller.startChangeEmailAddress(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data).to.be.null();
      expect(args[0].error).to.be.an.error(controller.EmailChangeError);
      expect(args[0].error).to.be.an.error('Too many email change attempts');
      expect(args[0].error.statusCode).to.equal(429);
      ;
    });

    test('logger.error to be called with error', async () => {
      helpers.getRecordsByUserId.returns({ rowCount: 3 });
      await controller.startChangeEmailAddress(request, h);
      const args = logger.error.lastCall.args;
      expect(args[0]).to.be.an.error(controller.EmailChangeError);
      expect(args[0]).to.be.an.error('Too many email change attempts');
    });

    test('happy path - return verificationId and authenticated flag', async () => {
      helpers.getRecordsByUserId.returns({ rowCount: 1 });
      await controller.startChangeEmailAddress(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data.verificationId).to.equal('1df3-jdf6-f2id');
      expect(args[0].data.authenticated).to.equal(true);
    });
  });
  experiment('createVerificationCode', async () => {
    beforeEach(async () => {
      helpers.usersRepo.findById.returns({ application: 'test-app' });
    });

    afterEach(async () => sandbox.restore());

    test('throw error if email address is already in use', async () => {
      helpers.usersRepo.checkEmailAddress.returns({ err: null, rows: [{ user_name: 'new-email@domain.com' }] });
      await controller.createVerificationCode(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data).to.be.null();
      expect(args[0].error).to.be.an.error(controller.EmailChangeError);
      expect(args[0].error).to.be.an.error('Email address already in use');
      expect(args[0].error.statusCode).to.equal(409);
    });

    test('logger.error to be called with error', async () => {
      helpers.usersRepo.checkEmailAddress.returns({ err: null, rows: [{ user_name: 'new-email@domain.com' }] });
      await controller.createVerificationCode(request, h);
      const args = logger.error.lastCall.args;
      expect(args[0]).to.be.an.error(controller.EmailChangeError);
      expect(args[0]).to.be.an.error('Email address already in use');
    });

    test('throw error if does not update 1 record', async () => {
      helpers.usersRepo.checkEmailAddress.returns({ err: null, rows: [] });
      helpers.emailChangeRepo.update.returns({ rowCount: 0, verification_code: '123456' });
      await controller.createVerificationCode(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data).to.be.null();
      expect(args[0].error).to.be.an.error(controller.EmailChangeError);
      expect(args[0].error).to.be.an.error('Email change verification record update error, id:asdf-9876-qwer');
      expect(args[0].error.statusCode).to.equal(500);
    });

    test('happy path - return verification code', async () => {
      helpers.usersRepo.checkEmailAddress.returns({ err: null, rows: [] });
      helpers.emailChangeRepo.update.returns({ rowCount: 1, verification_code: '123456' });
      await controller.createVerificationCode(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data.verificationCode).to.equal('123456');
      expect(args[0].error).to.be.null();
    });
  });
  experiment('checkVerificationCode', async () => {
    beforeEach(async () => {
      sandbox.stub(helpers, 'updateEmailAddress');
    });

    afterEach(async () => sandbox.restore());

    test('throw error if email address is already in use', async () => {
      helpers.emailChangeRepo.update.returns({ rowCount: 0, new_email_address: 'new_email@domain.com' });
      await controller.checkVerificationCode(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data).to.be.null();
      expect(args[0].error).to.be.an.error(controller.EmailChangeError);
      expect(args[0].error).to.be.an.error('Email change verification code has expired or is incorrect');
      expect(args[0].error.statusCode).to.equal(409);
    });

    test('logger.error to be called with error', async () => {
      helpers.emailChangeRepo.update.returns({ rowCount: 0, new_email_address: 'new_email@domain.com' });
      await controller.checkVerificationCode(request, h);
      const args = logger.error.lastCall.args;
      expect(args[0]).to.be.an.error(controller.EmailChangeError);
      expect(args[0]).to.be.an.error('Email change verification code has expired or is incorrect');
    });

    test('happy path - return new email address', async () => {
      helpers.emailChangeRepo.update.returns({ rowCount: 1, new_email_address: 'new_email@domain.com' });
      helpers.usersRepo.findById.returns({ application: 'test-app' });
      await controller.checkVerificationCode(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data.newEmail).to.equal('new_email@domain.com');
      expect(args[0].error).to.be.null();
    });
  });
});
