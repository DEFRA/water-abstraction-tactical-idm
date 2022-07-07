const config = require('../../../config')
const controller = require('./controller')

if (config.isAcceptanceTestTarget) {
  exports.acceptanceTestTearDown = {
    method: 'DELETE',
    path: `/idm/${config.version}/acceptance-tests`,
    handler: controller.deleteAcceptanceTestData,
    options: {
      description: 'Deletes any data setup for acceptance test execution'
    }
  }
}
