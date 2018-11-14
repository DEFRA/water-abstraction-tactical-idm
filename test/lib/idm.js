const { expect } = require('code');
const { before, after, experiment, test } = exports.lab = require('lab').script();
const helpers = require('../test-helpers');
const idm = require('../../src/lib/idm');
const uuidv4 = require('uuid/v4');

const getUser = async (userName, application) => {
  const result = await idm.getUserByUsername(userName, application);

  if (result.error) {
    throw result.error;
  }

  return result.data[0];
};

experiment('updateResetGuid', () => {
  let userID;
  let resetGuid;
  const userName = 'updateResetGuidUser@example.com';
  const application = 'water_vml';

  before(async () => {
    const result = await helpers.createUser(userName, 'pass', application);
    userID = result.user_id;

    resetGuid = uuidv4();
    await idm.updateResetGuid(userID, resetGuid);
  });

  after(async () => {
    await helpers.deleteUser(userID);
  });

  test('the reset guid is set', async () => {
    const user = await getUser(userName, application);
    expect(user.reset_guid).to.equal(resetGuid);
  });

  test('the reset_guid_date_created is set', async () => {
    const user = await getUser(userName, application);
    expect(user.reset_guid_date_created).to.exist();
  });
});
