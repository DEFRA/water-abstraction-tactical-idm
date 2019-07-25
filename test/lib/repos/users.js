const UsersRepository = require('../../../src/lib/repos/users');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const { pool } = require('../../../src/lib/connectors/db');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const usersRepo = new UsersRepository({
  connection: pool,
  table: 'idm.users',
  primaryKey: 'user_id'
});

experiment('UsersRepository', async () => {
  experiment('findById', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'find').returns({ rows: [{ first: 'element' }] });
    });

    afterEach(async () => sandbox.restore());

    test('returns first element in data', async () => {
      const result = await usersRepo.findById(1234);
      expect(result).to.equal({ first: 'element' });
    });

    test('calls this.find with correct params', async () => {
      await usersRepo.findById(1234);
      const [params] = Repository.prototype.find.lastCall.args;
      expect(params).to.equal({ user_id: 1234 });
    });
  });

  experiment('checkEmailAddress', async () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery');
    });

    afterEach(async () => sandbox.restore());

    test('calls this.dbQuery with correct params', async () => {
      await usersRepo.checkEmailAddress('cd6d-jub4-8jg5', 'test@domain.com');
      const [, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(params[0]).to.equal('cd6d-jub4-8jg5');
      expect(params[1]).to.equal('test@domain.com');
    });
  });

  experiment('updateEmailAddress', async () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'update');
    });

    afterEach(async () => sandbox.restore());

    test('calls this.update with correct params', async () => {
      await usersRepo.updateEmailAddress(1234, 'test@domain.com');
      const [filter, data] = Repository.prototype.update.lastCall.args;
      expect(filter).to.equal({ user_id: 1234 });
      expect(data).to.equal({ user_name: 'test@domain.com' });
    });
  });
});
