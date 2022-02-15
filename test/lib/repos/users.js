const moment = require('moment');
const UsersRepository = require('../../../src/lib/repos/users');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const { pool } = require('../../../src/lib/connectors/db');
const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const now = moment();

const usersRepo = new UsersRepository({
  connection: pool,
  table: 'idm.users',
  primaryKey: 'user_id'
});

experiment('UsersRepository', () => {
  afterEach(async () => {
    sandbox.restore();
  });

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

  experiment('findGroups', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery').resolves({ rows: [{ group: 'group_1' }] });
    });

    test('calls dbQuery with correct params', async () => {
      await usersRepo.findGroups(1234);
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([1234]);
    });

    test('maps returned rows to an an array of strings', async () => {
      const result = await usersRepo.findGroups(1234);
      expect(result).to.equal(['group_1']);
    });
  });

  experiment('findRoles', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery').resolves({ rows: [{ role: 'role_1' }] });
    });

    test('calls dbQuery with correct params', async () => {
      await usersRepo.findRoles(1234);
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([1234]);
    });

    test('maps returned rows to an an array of strings', async () => {
      const result = await usersRepo.findRoles(1234);
      expect(result).to.equal(['role_1']);
    });
  });

  experiment('findInSameApplication', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery').resolves({
        rows: [{
          user_id: 1
        }]
      });
    });

    afterEach(async () => sandbox.restore());

    test('calls this.dbQuery with correct params', async () => {
      await usersRepo.findInSameApplication(1234, 'test@domain.com');
      const [, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(params[0]).to.equal(1234);
      expect(params[1]).to.equal('test@domain.com');
    });

    test('resolves with the first user record found', async () => {
      const result = await usersRepo.findInSameApplication(1234, 'test@domain.com');
      expect(result).to.be.an.object();
    });
  });

  experiment('updateEmailAddress', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'update').resolves({
        rows: [{
          user_id: 'user_1'
        }]
      });
    });

    afterEach(async () => sandbox.restore());

    test('calls this.update with correct params', async () => {
      await usersRepo.updateEmailAddress(1234, 'test@domain.com', now);
      const [filter, data] = Repository.prototype.update.lastCall.args;
      expect(filter).to.equal({ user_id: 1234 });
      expect(data.user_name).to.equal('test@domain.com');
      expect(data.date_updated).to.equal(now.format());
    });

    test('resolves with first updated record', async () => {
      const user = await usersRepo.updateEmailAddress(1234, 'test@domain.com');
      expect(user.user_id).to.equal('user_1');
    });
  });

  experiment('findByUsername', () => {
    let result;

    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery')
        .resolves({ rows: [{ user_id: 123 }] });
      result = await usersRepo.findByUsername('mail@example.com', 'water_vml');
    });

    test('calls this.dbQuery with correct params', async () => {
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal(['mail@example.com', 'water_vml']);
    });

    test('resolves with the first row found', async () => {
      expect(result).to.equal({ user_id: 123 });
    });
  });

  experiment('incrementLockCount', () => {
    let result;

    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery')
        .resolves({ rows: [{ user_id: 123 }] });
      result = await usersRepo.incrementLockCount(123);
    });

    test('calls this.dbQuery with correct params', async () => {
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([123]);
    });

    test('resolves with the first row found', async () => {
      expect(result).to.equal({ user_id: 123 });
    });
  });

  experiment('voidCurrentPassword', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery');
      await usersRepo.voidCurrentPassword(123, 'reset-guid');
    });

    test('calls this.dbQuery with correct params', async () => {
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([123, 'reset-guid']);
    });
  });

  experiment('updateResetGuid', () => {
    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'update');
      await usersRepo.updateResetGuid(123, 'reset-guid');
    });

    test('calls this.update with correct params', async () => {
      const [filter, data] = Repository.prototype.update.lastCall.args;
      expect(filter).to.equal({ user_id: 123 });
      expect(data).to.equal({ reset_guid: 'reset-guid' });
    });
  });

  experiment('updateAuthenticatedUser', () => {
    let result;

    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery')
        .resolves({ rows: [{ user_id: 123 }] });
      result = await usersRepo.updateAuthenticatedUser(123);
    });

    test('calls this.dbQuery with correct params', async () => {
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([123]);
    });

    test('resolves with the first row found', async () => {
      expect(result).to.equal({ user_id: 123 });
    });
  });

  experiment('findRegistrationsByMonth', () => {
    let result;
    const data = [
      { application: 'water_vml', registrations: 1, month: 2 },
      { application: 'water_vml', registrations: 1, month: 2 }
    ];

    beforeEach(async () => {
      sandbox.stub(Repository.prototype, 'dbQuery')
        .resolves({ rows: data });
      result = await usersRepo.findRegistrationsByMonth();
    });

    test('calls this.dbQuery with no params', async () => {
      const [query, params] = Repository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal(undefined);
    });

    test('resolves with an array of objects', async () => {
      expect(result).to.equal(data);
    });
  });
});
