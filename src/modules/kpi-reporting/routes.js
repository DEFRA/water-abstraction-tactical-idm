const { version } = require('../../../config');
const controller = require('./controller');

module.exports = [{
  method: 'GET',
  path: '/idm/' + version + '/kpi/registrations',
  handler: controller.getRegistrations,
  options: {
    description: 'Gets KPI data for user registrations by month'
  }
}];
