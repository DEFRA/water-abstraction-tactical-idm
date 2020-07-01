'use strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const routes = require('../../../src/modules/kpi-reporting/routes');

experiment('modules/kpi-reporting/routes', () => {
  experiment('kpi/registrations', () => {
    test('exports the correct route', async () => {
      expect(routes[0].path).to.equal('/idm/1.0/kpi/registrations');
    });
    test('publishes a GET method', async () => {
      expect(routes[0].method).to.equal('GET');
    });
  });
});
