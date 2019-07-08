const changeEmailHelpers = require('../../src/lib/change-email-helpers');
const helpers = require('../../src/lib/helpers');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('change email helpers', async () => {
  beforeEach(() => {
    sandbox.stub(changeEmailHelpers.repo, 'find');
    sandbox.stub(changeEmailHelpers.repo, 'update');
    sandbox.stub(helpers, 'compareHash');
  });

  afterEach(() => sandbox.restore());

  experiment('authenticateUserById - user exists', async () => {
    beforeEach(() => {
      changeEmailHelpers.repo.find.returns({ user_id: '1' });
    });

    afterEach(() => sandbox.restore());

    test('returns 200 if password is correct', async () => {
      helpers.compareHash.returns(200);
      const result = await changeEmailHelpers.authenticateUserById('1', 'password1234');
      expect(result).to.equal(200);
    });

    test('returns 400 if password is correct', async () => {
      helpers.compareHash.returns(400);
      const result = await changeEmailHelpers.authenticateUserById('1', 'password1234');
      expect(result).to.equal(400);
    });
  });
  experiment('authenticateUserById - user doesn\'t exists', async () => {
    beforeEach(() => {
      changeEmailHelpers.repo.find.returns(undefined);
      helpers.compareHash.returns(200);
    });

    afterEach(() => sandbox.restore());

    test('returns 404', async () => {
      const result = await changeEmailHelpers.authenticateUserById('1', 'password1234');
      expect(result).to.equal(404);
    });
  });

  experiment('updateEmailAddress - successful email update', async () => {
    beforeEach(() => {
      changeEmailHelpers.repo.update.returns({ user_id: '1', rowCount: 1 });
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
      changeEmailHelpers.repo.update.returns({ error: { name: 'email change error' } });
      const func = () => changeEmailHelpers.updateEmailAddress('1', 'name@domain.com');
      expect(func()).to.reject();
    });

    test('throws error if rowCount === 0', async () => {
      changeEmailHelpers.repo.update.returns({ rowCount: 0 });
      const func = () => changeEmailHelpers.updateEmailAddress('1', 'name@domain.com');
      expect(func()).to.reject();
    });
  });
  experiment('createEmailChangeRecord', async () => {
  // test('repo.create is called with correct values', () => {
  //   controller.createEmailChangeRecord('1234');
  //   const createResults = controller.repo.create.lastCall.args;
  //   expect(createResults[0].email_change_verification_id).to.match(guidRegex);
  //   expect(createResults[0].user_id).to.equal('1234');
  //   expect(createResults[0].verification_code).to.match(verificationCodeRegex);
  //   expect(createResults[0].date_created).to.match(dateFormatRegex);
  //   expect(createResults[0].date_verified).to.be.null();
  // });
  });
});
