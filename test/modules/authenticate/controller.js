const controller = require('../../../src/modules/authenticate/controller');
const repos = require('../../../src/lib/repos');
const helpers = require('../../../src/lib/helpers');
const { logger } = require('../../../src/logger');
const Notify = require('../../../src/lib/connectors/notify');

const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const userId = 123;

const email = 'mail@example.com';

const createRequest = () => ({
  payload: {
    user_name: email,
    application: 'water_vml',
    password: 'test-password'
  }
});

experiment('authentication controller', () => {
  let h, code, request;

  beforeEach(async () => {
    code = sandbox.stub();
    h = {
      response: sandbox.stub().returns({ code })
    };
    request = createRequest();

    sandbox.stub(repos.usersRepo, 'findByUsername');
    sandbox.stub(repos.usersRepo, 'incrementLockCount').resolves({
      bad_logins: 5
    });
    sandbox.stub(repos.usersRepo, 'voidCurrentPassword');
    sandbox.stub(repos.usersRepo, 'updateAuthenticatedUser').resolves({
      user_id: userId,
      password: 'top-secret'
    });

    sandbox.stub(Notify, 'sendPasswordLockEmail');

    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
    sandbox.stub(helpers, 'testPassword').resolves(false);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  const expectUnauthorized = () => {
    const response = h.response.lastCall.args[0];
    expect(response.user_id).to.equal(null);
    expect(response.err).to.equal('Unknown user name or password');
    expect(code.calledWith(401)).to.equal(true);
  };

  experiment('postAuthenticate', () => {
    test('throws a 401 error if user not found', async () => {
      repos.usersRepo.findByUsername.resolves();
      await controller.postAuthenticate(request, h);
      expectUnauthorized();
      expect(logger.info.calledWith(`User ${email} not found`))
        .to.equal(true);
    });

    test('throws a 401 error if user account locked', async () => {
      repos.usersRepo.findByUsername.resolves({
        enabled: false
      });
      await controller.postAuthenticate(request, h);
      expectUnauthorized();
      expect(logger.info.calledWith(`User account ${email} is disabled`))
        .to.equal(true);
    });

    experiment('when the password is wrong and < 10 attempts', () => {
      beforeEach(async () => {
        repos.usersRepo.findByUsername.resolves({
          user_id: userId,
          enabled: true,
          password: 'x'
        });
        await controller.postAuthenticate(request, h);
      });

      test('throws a 401 error', async () => {
        expectUnauthorized();
        expect(logger.info.calledWith(`User ${email} unauthorized`))
          .to.equal(true);
      });

      test('increments the lock count', async () => {
        expect(repos.usersRepo.incrementLockCount.calledWith(userId)).to.be.true();
      });

      test('does not void the password', async () => {
        expect(repos.usersRepo.voidCurrentPassword.called).to.be.false();
      });

      test('does not send an email', async () => {
        expect(Notify.sendPasswordLockEmail.called).to.be.false();
      });
    });

    experiment('when the password is wrong and exactly 10 attempts', () => {
      beforeEach(async () => {
        repos.usersRepo.findByUsername.resolves({
          user_id: userId,
          user_name: 'test@example.com',
          application: 'water_vml',
          enabled: true,
          password: 'x'
        });
        repos.usersRepo.incrementLockCount.resolves({
          bad_logins: 10
        });
        await controller.postAuthenticate(request, h);
      });

      test('throws a 401 error', async () => {
        expectUnauthorized();
        expect(logger.info.calledWith(`User ${email} unauthorized`))
          .to.equal(true);
      });

      test('increments the lock count', async () => {
        expect(repos.usersRepo.incrementLockCount.calledWith(userId)).to.be.true();
      });

      test('voids the password', async () => {
        const { args } = repos.usersRepo.voidCurrentPassword.lastCall;
        expect(args[0]).to.equal(userId);
        expect(args[1]).to.be.a.string().length(36);
      });

      test('sends a password lock email', async () => {
        const [options] = Notify.sendPasswordLockEmail.lastCall.args;
        expect(options.email).to.equal('test@example.com');
        expect(options.firstname).to.equal('User');
        expect(options.resetGuid).to.be.a.string().length(36);
        expect(options.userApplication).to.equal('water_vml');
      });
    });

    experiment('when the password is correct', () => {
      let response;

      beforeEach(async () => {
        repos.usersRepo.findByUsername.resolves({
          user_id: userId,
          user_name: 'test@example.com',
          application: 'water_vml',
          enabled: true
        });

        helpers.testPassword.resolves(true);

        response = await controller.postAuthenticate(request, h);
      });

      test('updates the authenticated user last login time', async () => {
        expect(repos.usersRepo.updateAuthenticatedUser.calledWith(userId)).to.equal(true);
      });

      test('responds with user details excluding password', async () => {
        expect(response.user_id).to.equal(userId);
        expect(response.password).to.be.undefined();
        expect(response.err).to.equal(null);
      });
    });

    experiment('non-Boom errors are rethrown', () => {
      beforeEach(async () => {
        repos.usersRepo.findByUsername.rejects();
      });

      test('throws an error', async () => {
        const func = () => controller.postAuthenticate(request, h);
        expect(func()).to.reject();
      });
    });
  });
});
