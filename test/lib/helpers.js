const helpers = require('../../src/lib/helpers');
const { expect } = require('@hapi/code');
const { test, experiment } = exports.lab = require('@hapi/lab').script();

const allNumberCodeRegex = /[\d|\w]/;

experiment('change email helpers', async () => {
  experiment('createDigitCode', async () => {
    test('creates a random 6 digit code by default', async () => {
      const result = helpers.createDigitCode();
      expect(result).to.match(allNumberCodeRegex);
      expect(result.toString()).to.have.length(6);
    });

    test('creates a random digit code of any length, given a certain number', async () => {
      const result = helpers.createDigitCode(4);
      expect(result).to.match(allNumberCodeRegex);
      expect(result.toString()).to.have.length(4);
    });
  });
});
