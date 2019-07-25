const changeEmailHelpers = require('../../src/lib/change-email-helpers');
const helpers = require('../../src/lib/helpers');
const repos = require('../../src/lib/change-email-repos');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('change email helpers', async () => {
  beforeEach(() => {
    sandbox.stub(repos.usersRepo, 'update');
    sandbox.stub(repos.usersRepo, 'findById');
    sandbox.stub(repos.changeEmailRepo, 'create');
    sandbox.stub(repos.changeEmailRepo, 'find');
    sandbox.stub(helpers, 'compareHash');
  });

  afterEach(() => sandbox.restore());

  experiment('authenticateUserById - user exists', async () => {
    beforeEach(() => {
      repos.usersRepo.findById.returns({ password: 'password1234' });
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
      repos.usersRepo.findById.returns(undefined);
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
      repos.usersRepo.update.returns({ user_id: '1', rowCount: 1 });
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
      repos.usersRepo.update.returns({ error: { name: 'email change error' } });
      const func = () => changeEmailHelpers.updateEmailAddress('1', 'name@domain.com');
      expect(func()).to.reject();
    });

    test('throws error if rowCount === 0', async () => {
      repos.usersRepo.update.returns({ rowCount: 0 });
      const func = () => changeEmailHelpers.updateEmailAddress('1', 'name@domain.com');
      expect(func()).to.reject();
    });
  });
});
