const controller = require('../../src/controllers/change-email');
const helpers = require('../../src/lib/change-email-helpers');
const repos = require('../../src/lib/change-email-repos');
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
    sandbox.stub(repos.changeEmailRepo, 'updateEmailChangeRecord');
    sandbox.stub(repos.usersRepo, 'findById');
    sandbox.stub(repos.usersRepo, 'checkEmailAddress');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => sandbox.restore());

  experiment('startChangeEmailAddress', async () => {
    beforeEach(async () => {
      sandbox.stub(repos.changeEmailRepo, 'findByUserId');
      sandbox.stub(repos.changeEmailRepo, 'createEmailChangeRecord').resolves('1df3-jdf6-f2id');
      sandbox.stub(helpers, 'authenticateUserById');
    });

    afterEach(async () => sandbox.restore());

    test('throw error if more than 2 attempts to change password in previous 24 hrs', async () => {
      repos.changeEmailRepo.findByUserId.returns({ rowCount: 3 });
      await controller.startChangeEmailAddress(request, h);
      const [args] = h.response.lastCall.args;
      expect(args.data).to.be.null();
      expect(args.error).to.be.an.error(controller.EmailChangeError);
      expect(args.error).to.be.an.error('Too many email change attempts');
      expect(args.error.statusCode).to.equal(429);
      ;
    });

    test('happy path - return verificationId and authenticated flag', async () => {
      repos.changeEmailRepo.findByUserId.returns({ rowCount: 1 });
      helpers.authenticateUserById.returns(true);

      await controller.startChangeEmailAddress(request, h);
      const [args] = h.response.lastCall.args;
      expect(args.data.verificationId).to.equal('1df3-jdf6-f2id');
      expect(args.data.authenticated).to.equal(true);
    });
  });
  experiment('createVerificationCode', async () => {
    beforeEach(async () => {
      repos.usersRepo.findById.returns({ application: 'test-app' });
    });

    afterEach(async () => sandbox.restore());

    test('throw error if email address is already in use', async () => {
      repos.usersRepo.checkEmailAddress.returns({ err: null, rowCount: 1 });
      await controller.createVerificationCode(request, h);
      const [args] = h.response.lastCall.args;
      expect(args.data).to.be.null();
      expect(args.error).to.be.an.error(controller.EmailChangeError);
      expect(args.error).to.be.an.error('Email address already in use');
      expect(args.error.statusCode).to.equal(409);
    });

    test('logger.error to be called with error', async () => {
      repos.usersRepo.checkEmailAddress.returns({ err: null, rowCount: 1 });
      await controller.createVerificationCode(request, h);
      const [args] = logger.error.lastCall.args;
      expect(args).to.be.an.error(controller.EmailChangeError);
      expect(args).to.be.an.error('Email address already in use');
    });

    test('throw error updateEmailAddress returns error', async () => {
      const emailVerificationError = new controller.EmailChangeError('test error', 500);
      repos.usersRepo.checkEmailAddress.returns({ rowCount: 0 });
      repos.changeEmailRepo.updateEmailChangeRecord.returns({ err: emailVerificationError });
      await controller.createVerificationCode(request, h);
      const [args] = h.response.lastCall.args;
      expect(args.data).to.be.null();
      expect(args.error).to.be.an.error(controller.EmailChangeError);
      expect(args.error).to.be.an.error('test error');
      expect(args.error.statusCode).to.equal(500);
    });

    test('happy path - return verification code', async () => {
      repos.usersRepo.checkEmailAddress.returns({ err: null, rowCount: 0 });
      repos.changeEmailRepo.updateEmailChangeRecord.returns({ verificationCode: '123456' });
      await controller.createVerificationCode(request, h);
      const [args] = h.response.lastCall.args;
      expect(args.data.verificationCode).to.equal('123456');
      expect(args.error).to.be.null();
    });
  });
  experiment('checkVerificationCode', async () => {
    beforeEach(async () => {
      sandbox.stub(repos.changeEmailRepo, 'findRecordWithVerificationCode');
      sandbox.stub(helpers, 'updateEmailAddress');
    });

    afterEach(async () => sandbox.restore());

    test('throw error updateEmailChangeRecord returns error', async () => {
      const codeVerificationError = new controller.EmailChangeError('test error', 409);
      repos.changeEmailRepo.findRecordWithVerificationCode.returns({ err: codeVerificationError });
      await controller.checkVerificationCode(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data).to.be.null();
      expect(args[0].error).to.be.an.error(controller.EmailChangeError);
      expect(args[0].error).to.be.an.error('test error');
      expect(args[0].error.statusCode).to.equal(409);
    });

    test('happy path - return new email address', async () => {
      repos.changeEmailRepo.findRecordWithVerificationCode.returns({ newEmail: 'new_email@domain.com' });
      repos.usersRepo.findById.returns({ application: 'test-app' });
      await controller.checkVerificationCode(request, h);
      const args = h.response.lastCall.args;
      expect(args[0].data.newEmail).to.equal('new_email@domain.com');
      expect(args[0].error).to.be.null();
    });
  });
});
