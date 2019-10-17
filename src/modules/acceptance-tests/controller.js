const db = require('../../lib/connectors/db');
const ACCEPTANCE_TEST_SOURCE = 'acceptance-test-setup';
const config = require('../../../config');

const deleteUserRoles = () => {
  return db.query(`
    delete
      from idm.user_groups ug
      using idm.users u
    where
      ug.user_id = u.user_id
      and
      u.user_data->>'source' = '${ACCEPTANCE_TEST_SOURCE}';
  `);
};

const deleteUserGroups = () => {
  return db.query(`
    delete
      from idm.user_groups ug
      using idm.users u
    where
      ug.user_id = u.user_id
      and
      u.user_data->>'source' = '${ACCEPTANCE_TEST_SOURCE}';
  `);
};

const deleteAcceptanceTestData = async (request, h) => {
  await Promise.all([deleteUserRoles(), deleteUserGroups()]);
  await db.query(`
    delete
    from idm.users
    where user_data->>'source' = '${ACCEPTANCE_TEST_SOURCE}';
  `);

  return h.response().code(204);
};

if (config.isAcceptanceTestTarget) {
  exports.deleteAcceptanceTestData = deleteAcceptanceTestData;
}
