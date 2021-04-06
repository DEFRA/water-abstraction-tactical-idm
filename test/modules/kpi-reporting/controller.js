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
          month: 12,
          internal: 1,
          external: 2,
          current_year: false
        },
        {
          month: 3,
          internal: 3,
          external: 3,
          current_year: true
        },
        {
          month: 2,
          internal: 1,
          external: 1,
          current_year: true
        },
        {
          month: 1,
          internal: 2,
          external: 2,
          current_year: true
        }
      ];

      beforeEach(async () => {
        sandbox.stub(repos.usersRepo, 'findRegistrationsByMonth').resolves(repoData);
      });
      test('returns the correct array of objects', async () => {
        const { data } = await controller.getRegistrations();
        expect(data.totals.allTime).to.equal(15);
        expect(data.totals.ytd).to.equal(12);
        expect(data.monthly.length).to.equal(3);
        expect(data.monthly[0].month).to.equal('March');
        expect(data.monthly[0].internal).to.equal(3);
        expect(data.monthly[0].external).to.equal(3);
        expect(data.monthly[0].year).to.equal(new Date().getFullYear());
        expect(data.monthly[1].month).to.equal('February');
        expect(data.monthly[1].internal).to.equal(1);
        expect(data.monthly[1].external).to.equal(1);
        expect(data.monthly[1].year).to.equal(new Date().getFullYear());
      });
    });
  });
});
