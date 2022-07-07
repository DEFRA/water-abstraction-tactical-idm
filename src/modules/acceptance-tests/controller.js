const { pool } = require('../../lib/connectors/db')
const ACCEPTANCE_TEST_SOURCE = 'acceptance-test-setup'
const config = require('../../../config')

const deleteAcceptanceTestData = async (request, h) => {
  await pool.query(`
    delete
    from idm.users
    where user_data->>'source' = '${ACCEPTANCE_TEST_SOURCE}' 
    or user_name like '%@example.com';
  `)

  return h.response().code(204)
}

if (config.isAcceptanceTestTarget) {
  exports.deleteAcceptanceTestData = deleteAcceptanceTestData
}
