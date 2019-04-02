const { expect } = require('code');
const { beforeEach, afterEach, experiment, test } = exports.lab = require('lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const helpers = require('@envage/water-abstraction-helpers');

const water = require('../../../src/lib/connectors/water');
const logger = require('../../../src/lib/logger');

const response = { foo: 'bar' };
const personalisation = { name: 'bob' };
const recipient = 'bob@example.com';
const ref = 'message_1';
const token = 'token';

experiment('water connectors', () => {
  let jwtToken;

  beforeEach(async () => {
    sandbox.stub(helpers.serviceRequest, 'post').resolves(response);
    sandbox.stub(logger, 'error');
    jwtToken = process.env.JWT_TOKEN;
    process.env.JWT_TOKEN = token;
  });

  afterEach(async() => {
    process.env.JWT_TOKEN = jwtToken;
    sandbox.restore();
  });

  experiment('sendNotifyMessage', () => {
    test('calls serviceRequest.post with correct arguments', async() => {
      await water.sendNotifyMessage(ref, recipient, personalisation);
      const [uri, options] = helpers.serviceRequest.post.lastCall.args;
      expect(uri).to.equal(`http://127.0.0.1:8001/water/1.0/notify/${ref}`);
      expect(options).to.equal({
        body: {
          recipient,
          personalisation
        }
      });
    });

    test('resolves with the response from the POST request', async() => {
      const data = await water.sendNotifyMessage(ref, recipient, personalisation);
      expect(data).to.equal(response);
    });

    experiment('when the POST fails', () => {
      beforeEach(async() => {
        helpers.serviceRequest.post.rejects();
      });

      test('throws and logs an error', async() => {
        const func = () => water.sendNotifyMessage(ref, recipient, personalisation);
        await expect(func()).to.reject();
        expect(logger.error.callCount).to.equal(1);
      });
    });
  });
});
