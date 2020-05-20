'use-strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { mapRegistrations } = require('../../../../src/modules/kpi-reporting/lib/mapper');

experiment('modules/kpi-reporting/lib/mapper', () => {
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

  experiment('returns the correct mapped data', () => {
    test('returns the correct array of objects', async () => {
      const mappedData = mapRegistrations(repoData);
      console.log(mappedData);
      expect(mappedData[0].allTime.registrations).to.equal(2);
      expect(mappedData[1].allTime.registrations).to.equal(4);
      expect(mappedData[0].currentYear.registrations).to.equal(1);
      expect(mappedData[0].currentYear.monthly[0].registrations).to.equal(1);
      expect(mappedData[0].allTime.registrations).to.equal(2);
      expect(mappedData[1].currentYear.registrations).to.equal(2);
      expect(mappedData[1].currentYear.monthly[0].registrations).to.equal(2);
      expect(mappedData[1].allTime.registrations).to.equal(4);
    });
  });
});
