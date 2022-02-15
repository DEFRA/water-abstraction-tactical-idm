const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const repos = require('../../../src/lib/repos');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const sixDigitCodeRegex = /[\d|\w]{6}/;

const changeEmailRepo = repos.changeEmailRepo;

const response = {
  rows: [{
    email_change_id: 'email_change_1',
    attempts: 2
  }]
};

experiment('ChangeEmailRepository', () => {
  beforeEach(async () => {
    sandbox.stub(Repository.prototype, 'find');
    sandbox.stub(Repository.prototype, 'dbQuery').resolves(response);
  });

  afterEach(async () => sandbox.restore());

  experiment('findOneByUserId', () => {
    test('calls this.dbQuery with correct params', async () => {
      await changeEmailRepo.findOneByUserId(1234);
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([1234]);
    });

    test('resolves with first record found', async () => {
      const result = await changeEmailRepo.findOneByUserId(1234);
      expect(result).to.equal(response.rows[0]);
    });
  });

  experiment('create', () => {
    test('calls this.dbQuery with correct params', async () => {
      await changeEmailRepo.create(1234, 'mail@example.com');
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();

      expect(params[0]).to.equal(1234);
      expect(params[1]).to.equal('mail@example.com');
      expect(params[2]).to.match(sixDigitCodeRegex);
    });

    test('resolves with first record found', async () => {
      const result = await changeEmailRepo.create(1234, 'mail@example.com');
      expect(result).to.equal(response.rows[0]);
    });
  });

  experiment('incrementSecurityCodeAttempts', () => {
    test('calls this.dbQuery with correct params', async () => {
      await changeEmailRepo.incrementSecurityCodeAttempts(1234);
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([1234]);
    });
  });

  experiment('updateVerified', () => {
    test('calls this.dbQuery with correct params', async () => {
      await changeEmailRepo.updateVerified(1234, '012345');
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([1234, '012345']);
    });
  });
});
