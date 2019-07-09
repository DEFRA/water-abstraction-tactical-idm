const changeEmailHelpers = require('../../src/lib/change-email-helpers');
const helpers = require('../../src/lib/helpers');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const allNumberCodeRegex = /[\d|\w]/;

experiment('change email helpers', async () => {
  beforeEach(() => {
    sandbox.stub(changeEmailHelpers.usersRepo, 'update');
    sandbox.stub(changeEmailHelpers.usersRepo, 'findById');
    sandbox.stub(changeEmailHelpers.emailChangeRepo, 'create');
    sandbox.stub(changeEmailHelpers.emailChangeRepo, 'find');
    sandbox.stub(helpers, 'compareHash');
  });

  afterEach(() => sandbox.restore());

  experiment('authenticateUserById - user exists', async () => {
    beforeEach(() => {
      changeEmailHelpers.usersRepo.findById.returns({ password: 'password1234' });
    });

    afterEach(() => sandbox.restore());

    test('returns result of compareHash', async () => {
      helpers.compareHash.returns({ compareHash: 'result' });
      const result = await changeEmailHelpers.authenticateUserById('1', 'password1234');
      expect(result).to.equal({ compareHash: 'result' });
    });
  });

  experiment('authenticateUserById - user doesn\'t exists', async () => {
    beforeEach(() => {
      changeEmailHelpers.usersRepo.findById.returns(undefined);
      helpers.compareHash.returns(200);
    });

    afterEach(() => sandbox.restore());

    test('throws error', async () => {
      const func = changeEmailHelpers.authenticateUserById('1', 'password1234');
      expect(func).to.reject();
    });
  });

  experiment('updateEmailAddress - successful email update', async () => {
    beforeEach(() => {
      changeEmailHelpers.usersRepo.update.returns({ user_id: '1', rowCount: 1 });
    });

    afterEach(() => sandbox.restore());

    test('does not throw an error if email update successful', async () => {
      const func = () => changeEmailHelpers.updateEmailAddress('1', 'name@domain.com');
      expect(func()).not.to.reject();
    });
  });

  experiment('updateEmailAddress - unsuccessful email update', async () => {
    afterEach(() => sandbox.restore());

    test('throws error if error is returned', async () => {
      changeEmailHelpers.usersRepo.update.returns({ error: { name: 'email change error' } });
      const func = () => changeEmailHelpers.updateEmailAddress('1', 'name@domain.com');
      expect(func()).to.reject();
    });

    test('throws error if rowCount === 0', async () => {
      changeEmailHelpers.usersRepo.update.returns({ rowCount: 0 });
      const func = () => changeEmailHelpers.updateEmailAddress('1', 'name@domain.com');
      expect(func()).to.reject();
    });
  });

  experiment('createDigitCode', async () => {
    afterEach(() => sandbox.restore());

    test('creates a random 6 digit code by default', async () => {
      const result = changeEmailHelpers.createDigitCode();
      expect(result).to.match(allNumberCodeRegex);
      expect(result.toString()).to.have.length(6);
    });

    test('creates a random digit code of any length, given a certain number', async () => {
      const result = changeEmailHelpers.createDigitCode(4);
      expect(result).to.match(allNumberCodeRegex);
      expect(result.toString()).to.have.length(4);
    });
  });
});
