const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  test,
  experiment
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { usersRepo } = require('../../src/lib/repos');

const controller = require('../../src/controllers/user-roles');

experiment('controllers/user-roles', () => {
  let request;

  beforeEach(async () => {
    sandbox.stub(usersRepo, 'findById').resolves({
      user_id: 123
    });
    sandbox.stub(usersRepo, 'createRoles').resolves();
    sandbox.stub(usersRepo, 'createGroups').resolves();
    sandbox.stub(usersRepo, 'deleteRoles').resolves();
    sandbox.stub(usersRepo, 'findUserWithRoles').resolves({
      user_id: 123,
      password: 'test-password'
    });

    request = {
      params: { userId: 123 },
      payload: {
        application: 'test-application',
        roles: ['roleA'],
        groups: ['groupA', 'groupB']
      }
    };
  });

  afterEach(async () => sandbox.restore());

  experiment('.putUserRoles', () => {
    test('returns a 404 if the user does not exist', async () => {
      usersRepo.findById.resolves();
      const response = await controller.putUserRoles(request);

      expect(response.isBoom).to.be.true();
      expect(response.output.statusCode).to.equal(404);
    });

    test('deletes any existing roles', async () => {
      await controller.putUserRoles(request);
      const [userId] = usersRepo.deleteRoles.lastCall.args;
      expect(userId).to.equal(123);
    });

    test('creates the new roles', async () => {
      await controller.putUserRoles(request);
      const [userId, application, roles] = usersRepo.createRoles.lastCall.args;
      expect(userId).to.equal(123);
      expect(application).to.equal('test-application');
      expect(roles).to.equal(['roleA']);
    });

    test('creates the new groups', async () => {
      await controller.putUserRoles(request);
      const [userId, application, groups] = usersRepo.createGroups.lastCall.args;
      expect(userId).to.equal(123);
      expect(application).to.equal('test-application');
      expect(groups).to.equal(['groupA', 'groupB']);
    });

    test('returns the updated user excluding the password', async () => {
      const response = await controller.putUserRoles(request);
      expect(response).to.equal({
        error: null,
        data: {
          user_id: 123
        }
      });
    });
  });
});
