const helpers = require('../../src/lib/helpers');
const { expect } = require('@hapi/code');
const { test, experiment } = exports.lab = require('@hapi/lab').script();

const allNumberCodeRegex = /[\d|\w]/;

const plainText = 'Test1234';
const hash = '$2b$10$H8Vd7SlmsEZ..N/.wDIlXOUeMD0oAjnJi8zmKL6Rt3H69ITpMUhOK';

experiment('helpers', () => {
  experiment('createDigitCode', () => {
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

  experiment('testPassword', () => {
    test('when password matches hash, resolves true', async () => {
      const result = await helpers.testPassword(plainText, hash);
      expect(result).to.equal(true);
    });

    test('when password does not match hash, resolves false', async () => {
      const result = await helpers.testPassword('wrong', hash);
      expect(result).to.equal(false);
    });
  });
});
