const controller = require('../../../src/modules/change-email/controller');
const repos = require('../../../src/lib/repos');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const userId = 123;
const securityCode = '987123';
const newEmail = 'new@example.com';

const createResponse = (overrides = {}) => ({
  user_id: userId,
  new_email_address: newEmail,
  attempts: 1,
  security_code_attempts: 2,
  date_verified: null,
  security_code: securityCode,
  ...overrides
});

experiment('change email controller', () => {
  let h, code;

  const expectErrorResponse = errorCode => {
    const response = h.response.lastCall.args[0];
    expect(response.data).to.equal(null);
    expect(response.error).to.be.a.string();
    expect(code.calledWith(errorCode)).to.equal(true);
  };

  beforeEach(async () => {
    sandbox.stub(repos.changeEmailRepo, 'findOneByUserId');
    sandbox.stub(repos.changeEmailRepo, 'create');
    sandbox.stub(repos.changeEmailRepo, 'incrementSecurityCodeAttempts');
    sandbox.stub(repos.changeEmailRepo, 'updateVerified');

    sandbox.stub(repos.usersRepo, 'findInSameApplication');
    sandbox.stub(repos.usersRepo, 'updateEmailAddress');
    code = sandbox.stub();
    h = {
      response: sandbox.stub().returns({ code })
    };
  });

  afterEach(async () => sandbox.restore());

  experiment('getStatus', () => {
    const request = {
      params: {
        userId
      }
    };

    test('404 error if email change record not found', async () => {
      await controller.getStatus(request, h);
      expectErrorResponse(404);
    });

    test('returns response if found', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse());
      const result = await controller.getStatus(request, h);
      expect(result.error).to.equal(null);
      expect(result.data.userId).to.equal(userId);
      expect(result.data.email).to.equal(newEmail);
      expect(result.data.isLocked).to.equal(false);
    });

    test('locked flag in response is true if date_verified not null', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse({
        date_verified: '2019-08-08 12:00:00'
      }));
      const result = await controller.getStatus(request, h);
      expect(result.data.isLocked).to.equal(true);
    });

    test('locked flag in response is true if >=3 email change attempts', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse({
        attempts: 3
      }));
      const result = await controller.getStatus(request, h);
      expect(result.data.isLocked).to.equal(true);
    });

    test('locked flag in response is true if >=3 security code attempts', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse({
        security_code_attempts: 4
      }));
      const result = await controller.getStatus(request, h);
      expect(result.data.isLocked).to.equal(true);
    });
  });
  experiment('postStartEmailChange', () => {
    const request = {
      params: {
        userId
      },
      payload: {
        email: newEmail
      }
    };

    test('429 error if rate limit exceeded', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse({
        attempts: 4
      }));
      await controller.postStartEmailChange(request, h);
      expectErrorResponse(429);
    });

    test('423 error (locked) if already verified', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse({
        date_verified: '2019-08-08 12:00:00'
      }));
      await controller.postStartEmailChange(request, h);
      expectErrorResponse(423);
    });

    test('409 conflict if user already exists', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse());
      repos.usersRepo.findInSameApplication.resolves({ user_id: 123 });
      await controller.postStartEmailChange(request, h);
      expect(repos.usersRepo.findInSameApplication.calledWith(
        userId, newEmail
      )).to.equal(true);
      expectErrorResponse(409);
    });

    test('happy path - if not locked or rate limited, upserts', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse());
      repos.changeEmailRepo.create.resolves(createResponse());
      const response = await controller.postStartEmailChange(request, h);
      expect(repos.changeEmailRepo.create.calledWith(
        userId, newEmail
      )).to.equal(true);
      expect(response).to.equal({
        error: null,
        data: {
          userId,
          securityCode
        }
      });
    });
  });

  experiment('postSecurityCode', () => {
    const request = {
      params: {
        userId
      },
      payload: {
        securityCode
      }
    };

    test('increments security code attempt counter', async () => {
      await controller.postSecurityCode(request, h);
      expect(repos.changeEmailRepo.incrementSecurityCodeAttempts.calledWith(
        userId
      )).to.equal(true);
    });

    test('loads email change record for current user and date', async () => {
      await controller.postSecurityCode(request, h);
      expect(repos.changeEmailRepo.findOneByUserId.calledWith(
        userId
      )).to.equal(true);
    });

    test('404 not found error if email change record not found', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves();
      await controller.postSecurityCode(request, h);
      expectErrorResponse(404);
    });

    test('429 rate limit exceeded if too many attempts', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse({
        security_code_attempts: 4
      }));
      await controller.postSecurityCode(request, h);
      expectErrorResponse(429);
    });

    test('401 unauthorized if security code is not correct', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse({
        security_code: '012345'
      }));
      await controller.postSecurityCode(request, h);
      expectErrorResponse(401);
    });

    test('423 locked already verified', async () => {
      repos.changeEmailRepo.findOneByUserId.resolves(createResponse({
        date_verified: '2019-08-08 12:12:00'
      }));
      await controller.postSecurityCode(request, h);
      expectErrorResponse(423);
    });

    experiment('happy path', () => {
      let result;

      beforeEach(async () => {
        repos.changeEmailRepo.findOneByUserId.resolves(createResponse());
        repos.usersRepo.updateEmailAddress.resolves({
          user_id: 123,
          user_name: newEmail
        });
        result = await controller.postSecurityCode(request, h);
      });

      test('updates verified date of email change record', async () => {
        expect(repos.changeEmailRepo.updateVerified.calledWith(
          userId, securityCode
        )).to.equal(true);
      });

      test('updates the users email address', async () => {
        expect(repos.usersRepo.updateEmailAddress.calledWith(
          userId, newEmail
        )).to.equal(true);
      });

      test('responds with the user ID and new email address', async () => {
        expect(result).to.equal({
          error: null,
          data: {
            userId,
            email: newEmail
          }
        });
      });
    });
  });
});
