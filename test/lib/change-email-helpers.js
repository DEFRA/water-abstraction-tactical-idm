const changeEmailHelpers = require('../../src/lib/change-email-helpers');
const helpers = require('../../src/lib/helpers');
const controller = require('../../src/controllers/change-email');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const guidRegex = /[\d|\w]{8}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{12}/;
const verificationCodeRegex = /[\d|\w]{5}/;
const dateFormatRegex = /[\d]{4}-[\d]{2}-[\d]{2} [\d]{2}:[\d]{2}:[\d]{2}/;

experiment('change email helpers', async () => {
  beforeEach(() => {
    sandbox.stub(changeEmailHelpers.usersRepo, 'update');
    sandbox.stub(changeEmailHelpers.usersRepo, 'findById');
    sandbox.stub(changeEmailHelpers.emailChangeRepo, 'create');
    sandbox.stub(changeEmailHelpers.emailChangeRepo, 'find');
    sandbox.stub(helpers, 'compareHash');
  });

  afterEach(() => sandbox.restore());

  experiment('createEmailChangeRecord', async () => {
    test('repo.create is called with correct values', async () => {
      await changeEmailHelpers.createEmailChangeRecord('1234');
      const createResults = changeEmailHelpers.emailChangeRepo.create.lastCall.args;
      expect(createResults[0].email_change_verification_id).to.match(guidRegex);
      expect(createResults[0].user_id).to.equal('1234');
      expect(createResults[0].verification_code).to.be.null();
      expect(createResults[0].date_created).to.match(dateFormatRegex);
      expect(createResults[0].date_verified).to.be.null();
    });

    experiment('getEmailChangeRecordById', async () => {
      test('returns data if rowCount === 1', async () => {
        changeEmailHelpers.emailChangeRepo.find.returns({ data: [{ test: 'data' }], rowCount: 1 });
        const results = await changeEmailHelpers.getEmailChangeRecordById('1234-abcd');
        expect(results).to.equal({ test: 'data' });
      });

      test('throws error if rowCount !== 1', async () => {
        changeEmailHelpers.emailChangeRepo.find.returns({ data: [{ test: 'data' }], rowCount: 0 });
        const func = changeEmailHelpers.getEmailChangeRecordById('1', 'password1234');
        expect(func).to.reject();
      });
    });

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
  });
});
