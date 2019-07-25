const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const repos = require('../../../src/lib/change-email-repos');
const helpers = require('../../../src/lib/helpers');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const timeStampRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/;
const guidRegex = /[\d|\w]{8}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{12}/;
const sixDigitCodeRegex = /[\d|\w]{6}/;

const changeEmailRepo = repos.changeEmailRepo;

experiment('ChangeEmailRepository', async () => {
  afterEach(async () => sandbox.restore());

  experiment('findByUserId', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'find');
    });

    test('calls this.find with correct params', async () => {
      await changeEmailRepo.findByUserId(1234);
      const params = Repository.prototype.find.lastCall.args;
      expect(params[0].user_id).to.equal(1234);
      expect(params[0].date_created['$gte']).to.match(timeStampRegex);
    });
  });

  experiment('createEmailChangeRecord', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'create').returns({ rows: [{ email_change_verification_id: 't3st-1di4' }] });
    });

    test('calls this.create with correct params', async () => {
      await changeEmailRepo.createEmailChangeRecord(1234, true);
      const [params] = Repository.prototype.create.lastCall.args;
      expect(params).to.be.an.object();
      expect(params.email_change_verification_id).to.match(guidRegex);
      expect(params.user_id).to.equal(1234);
      expect(params.new_email_address).to.be.null();
      expect(params.authenticated).to.be.true();
      expect(params.verification_code).to.be.null();
      expect(params.date_created).to.match(timeStampRegex);
      expect(params.date_verified).to.be.null();
    });
  });

  experiment('updateEmailChangeRecord', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'update').returns({ rowCount: 1, rows: [{ verification_code: '123456' }] });
      sandbox.stub(helpers, 'createDigitCode').returns(123456);
    });

    test('calls this.update with correct params', async () => {
      await changeEmailRepo.updateEmailChangeRecord('dfj8-fd49-7d29', 'test@domain.com');
      const [filter, data] = Repository.prototype.update.lastCall.args;
      expect(filter.email_change_verification_id).to.equal('dfj8-fd49-7d29');
      expect(filter.date_created['$gte']).to.match(timeStampRegex);
      expect(filter.authenticated).to.be.true();
      expect(data.new_email_address).to.equal('test@domain.com');
      expect(data.verification_code).to.be.a.number().and.to.match(sixDigitCodeRegex);
    });
  });

  experiment('findRecordWithVerificationCode', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'update').returns({ rowCount: 1, rows: [{ new_email_address: 'test@domain.com' }] });
    });

    test('calls this.update with correct params', async () => {
      await changeEmailRepo.findRecordWithVerificationCode(1234, 123456);
      const [filter, data] = Repository.prototype.update.lastCall.args;
      expect(filter.user_id).to.equal(1234);
      expect(filter.date_created['$gte']).to.match(timeStampRegex);
      expect(filter.verification_code).to.equal(123456);
      expect(data.date_verified).to.match(timeStampRegex);
    });
  });
});
