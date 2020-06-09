'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const repos = require('../../../src/lib/repos');
const controller = require('../../../src/modules/kpi-reporting/controller');

experiment('/modules/kpi-reporting/controller', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getRegistrations', () => {
    experiment('when no data is returned', () => {
      const request = {
      };
      const code = sandbox.stub();
      const h = {
        response: sandbox.stub().returns({ code })
      };
      beforeEach(async () => {
        sandbox.stub(repos.usersRepo, 'findRegistrationsByMonth').resolves();
      });
      test('returns an error when no data found', async () => {
        const response = await controller.getRegistrations(request, h);
        expect(response.output.payload.message).to.equal('No data found from users table');
        expect(response.output.statusCode).to.equal(404);
      });
    });

    experiment('when data is returned', () => {
      const repoData = [
        {
          application: 'water_vml',
          registrations: 1,
          current_year: false
        },
        {
          application: 'water_vml',
          registrations: 1,
          current_year: true,
          month: 1
        },
        {
          application: 'water_admin',
          registrations: 2,
          current_year: true,
          month: 1
        },
        {
          application: 'water_admin',
          registrations: 2,
          current_year: false,
          month: 1
        }
      ];

      beforeEach(async () => {
        sandbox.stub(repos.usersRepo, 'findRegistrationsByMonth').resolves(repoData);
      });
      test('returns the correct array of objects', async () => {
        const response = await controller.getRegistrations();
        expect(response.data[0].allTime.registrations).to.equal(2);
        expect(response.data[1].allTime.registrations).to.equal(4);
        expect(response.data[0].currentYear.registrations).to.equal(1);
        expect(response.data[0].currentYear.monthly[0].registrations).to.equal(1);
        expect(response.data[0].allTime.registrations).to.equal(2);
        expect(response.data[1].currentYear.registrations).to.equal(2);
        expect(response.data[1].currentYear.monthly[0].registrations).to.equal(2);
        expect(response.data[1].allTime.registrations).to.equal(4);
        expect(response.error).to.equal(null);
      });
    });
  });
});
