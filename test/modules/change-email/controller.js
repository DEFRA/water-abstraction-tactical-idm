const controller = require('../../../src/modules/change-email/controller');
const repos = require('../../../src/lib/repos');
const helpers = require('../../../src/lib/helpers');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { logger } = require('../../../src/logger');

const request = {
  payload: {
    userId: 123,
    password: 'test-password',
    email: 'new-email@domain.com',
    application: 'test-application',
    verificationId: 'asdf-9876-qwer'
  }
};

const userRow = {
  user_id: 123,
  password: 'password-hash-here'
};

const securityCode = '987123';

experiment('change email controller', () => {
  let h, code;

  const expectErrorResponse = errorCode => {
    const response = h.response.lastCall.args[0];
    expect(response.data).to.equal(null);
    expect(response.error).to.be.a.string();
    expect(code.calledWith(errorCode)).to.equal(true);
  };

  beforeEach(async () => {
    sandbox.stub(repos.changeEmailRepo, 'updateEmailChangeRecord').resolves(securityCode);
    sandbox.stub(repos.usersRepo, 'findById').resolves(userRow);
    sandbox.stub(repos.usersRepo, 'findExistingByVerificationId');
    sandbox.stub(logger, 'error');
    sandbox.stub(helpers, 'testPassword').resolves(true);
    code = sandbox.stub();
    h = {
      response: sandbox.stub().returns({ code })
    };
  });

  afterEach(async () => sandbox.restore());

  experiment('startChangeEmailAddress', () => {
    beforeEach(async () => {
      sandbox.stub(repos.changeEmailRepo, 'findByUserId');
      sandbox.stub(repos.changeEmailRepo, 'createEmailChangeRecord').resolves('1df3-jdf6-f2id');
    });

    test('404 error if user not found', async () => {
      repos.usersRepo.findById.resolves();
      await controller.startChangeEmailAddress(request, h);
      expectErrorResponse(404);
    });

    test('429 error if more than 2 attempts to change password in previous 24 hrs', async () => {
      repos.changeEmailRepo.findByUserId.resolves({ rowCount: 3 });
      await controller.startChangeEmailAddress(request, h);
      expectErrorResponse(429);
    });

    test('non-Boom errors are rethrown by error handler', async () => {
      repos.usersRepo.findById.throws();
      const func = () => controller.startChangeEmailAddress(request, h);
      expect(func()).to.reject();
    });

    test('happy path - return verificationId and authenticated flag', async () => {
      repos.changeEmailRepo.findByUserId.returns({ rowCount: 1 });

      const response = await controller.startChangeEmailAddress(request, h);
      expect(response.data.verificationId).to.equal('1df3-jdf6-f2id');
      expect(response.data.authenticated).to.equal(true);
    });
  });
  experiment('createVerificationCode', () => {
    beforeEach(async () => {
      repos.usersRepo.findById.returns({ application: 'test-app' });
    });

    test('409 error if email address is already in use', async () => {
      repos.usersRepo.findExistingByVerificationId.resolves(userRow);
      await controller.createVerificationCode(request, h);
      expectErrorResponse(409);
    });

    test('401 error if security code not generated', async () => {
      repos.changeEmailRepo.updateEmailChangeRecord.resolves();
      await controller.createVerificationCode(request, h);
      expectErrorResponse(401);
    });

    test('happy path - return verification code', async () => {
      const response = await controller.createVerificationCode(request, h);
      expect(response.data.verificationCode).to.equal(securityCode);
      expect(response.error).to.equal(null);
    });
  });
  experiment('checkVerificationCode', () => {
    beforeEach(async () => {
      sandbox.stub(repos.changeEmailRepo, 'findOneByVerificationCode');
      sandbox.stub(repos.changeEmailRepo, 'incrementAttemptCounter');
      sandbox.stub(repos.changeEmailRepo, 'updateDateVerified');
      sandbox.stub(repos.usersRepo, 'updateEmailAddress');
    });

    experiment('when email change record not found', () => {
      beforeEach(async () => {
        repos.changeEmailRepo.findOneByVerificationCode.resolves();
      });

      test('increments attempt counter', async () => {
        await controller.checkVerificationCode(request, h);
        expect(repos.changeEmailRepo.incrementAttemptCounter.calledWith(
          request.payload.userId
        )).to.equal(true);
      });

      test('401 error response', async () => {
        await controller.checkVerificationCode(request, h);
        expectErrorResponse(401);
      });
    });

    experiment('when user not found', () => {
      beforeEach(async () => {
        repos.changeEmailRepo.findOneByVerificationCode.resolves({
          new_email_address: 'mail@example.com'
        });
        repos.usersRepo.updateEmailAddress.resolves();
      });

      test('404 error response', async () => {
        await controller.checkVerificationCode(request, h);
        expectErrorResponse(404);
      });
    });

    experiment('happy path', () => {
      const changeEmailRow = {
        new_email_address: 'mail@example.com'
      };

      beforeEach(async () => {
        repos.changeEmailRepo.findOneByVerificationCode.resolves(changeEmailRow);
        repos.usersRepo.updateEmailAddress.resolves(userRow);
      });

      test('findOneByVerificationCode called with payload params', async () => {
        await controller.checkVerificationCode(request, h);
        expect(repos.changeEmailRepo.findOneByVerificationCode.calledWith(
          request.payload.userId, request.payload.securityCode
        )).to.equal(true);
      });

      test('updateEmailAddress called with new email address', async () => {
        await controller.checkVerificationCode(request, h);
        expect(repos.usersRepo.updateEmailAddress.calledWith(
          request.payload.userId, changeEmailRow.new_email_address
        )).to.equal(true);
      });

      test('updateDateVerified called with email change record', async () => {
        await controller.checkVerificationCode(request, h);
        expect(repos.changeEmailRepo.updateDateVerified.calledWith(
          changeEmailRow
        )).to.equal(true);
      });

      test('responds with user ID and new email address', async () => {
        const response = await controller.checkVerificationCode(request, h);
        expect(response.data).to.equal({
          newEmail: changeEmailRow.new_email_address,
          userId: request.payload.userId
        });
        expect(response.error).to.equal(null);
      });
    });
  });
});
