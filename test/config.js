const { test, experiment, before, after } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

function requireUncached (module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

experiment('config.js', () => {
  const originalTestMode = process.env.TEST_MODE;

  after(async () => {
    process.env.TEST_MODE = originalTestMode;
  });

  experiment('when test mode is enabled', () => {
    let config;

    before(async () => {
      process.env.TEST_MODE = '1';
      config = requireUncached('../config.js');
    });

    test('logging level is "info"', async () => {
      expect(config.logger.level).to.equal('info');
    });

    test('default application base url for external service', async () => {
      expect(config.application.water_vml).to.equal('http://127.0.0.1:8000');
    });

    test('default application base url for internal service', async () => {
      expect(config.application.water_admin).to.equal('http://127.0.0.1:8008');
    });
  });

  experiment('when test mode is disabled', () => {
    let config;

    before(async () => {
      process.env.TEST_MODE = '0';
      config = requireUncached('../config.js');
    });

    test('logging level is "error"', async () => {
      expect(config.logger.level).to.equal('error');
    });
  });
});
