
const Lab = require('lab');
const { test, experiment, before } = exports.lab = Lab.script();
const { expect } = require('code');

function requireUncached (module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

experiment('config.js', () => {
  experiment('when test mode is enabled', () => {
    let config;

    before(async() => {
      process.env.TEST_MODE = '1';
      config = requireUncached('../config.js');
    });

    test('logging level is "info"', async() => {
      expect(config.logger.level).to.equal('info');
    });
  });

  experiment('when test mode is disabled', () => {
    let config;

    before(async() => {
      process.env.TEST_MODE = '0';
      config = requireUncached('../config.js');
    });

    test('logging level is "error"', async() => {
      expect(config.logger.level).to.equal('error');
    });
  });
});
