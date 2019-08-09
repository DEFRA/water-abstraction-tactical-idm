const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const ReauthenticationRepository = require('../../../src/lib/repos/reauthentication');

const userId = 123;
const response = { rows: [{
  user_id: userId
}] };

experiment('ReauthenticationRepository', async () => {
  let connection, repo;

  beforeEach(async () => {
    connection = {
      query: sandbox.stub().resolves(response)
    };
    repo = new ReauthenticationRepository({
      connection
    });
  });
  afterEach(async () => sandbox.restore());

  experiment('findByUserId', () => {
    test('makes a DB query with the correct arguments', async () => {
      await repo.findByUserId(userId);
      const [query, params] = connection.query.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([userId]);
    });

    test('resolves with the first row of data', async () => {
      const data = await repo.findByUserId(userId);
      expect(data).to.equal(response.rows[0]);
    });
  });

  experiment('resetAttemptCounter', () => {
    test('makes a DB query with the correct arguments', async () => {
      await repo.resetAttemptCounter(userId);
      const [query, params] = connection.query.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([userId]);
    });
  });
});
