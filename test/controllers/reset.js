const { expect } = require('@hapi/code');
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const controller = require('../../src/controllers/reset');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const idm = require('../../src/lib/idm');
const notify = require('../../src/lib/connectors/notify');
const uuid = require('uuid/v4');
const moment = require('moment');

const getResponseToolkitStub = () => {
  const h = {};
  h.response = sinon.stub().returns(h);
  h.code = sinon.stub().returns(h);
  return h;
};

const getRequest = email => {
  return {
    query: {},
    params: {
      application: 'water_vml',
      email
    },
    log: () => {}
  };
};

const guidRegex = /[\d|\w]{8}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{12}/;

experiment('resetPassword', async () => {
  beforeEach(async () => {
    sandbox.stub(idm, 'getUserByUsername');
    sandbox.stub(idm, 'updateResetGuid').resolves({});
    sandbox.stub(notify, 'sendPasswordResetEmail').resolves({});
  });

  afterEach(async () => sandbox.restore());

  test('returns a 404 for an unknown user', async () => {
    idm.getUserByUsername.resolves({
      err: null,
      data: []
    });

    const request = getRequest('nope@example.com');
    const h = getResponseToolkitStub();

    await controller.resetPassword(request, h);

    expect(h.code.args[0][0]).to.equal(404);
    expect(h.response.args[0][0].data).to.be.null();
    expect(h.response.args[0][0].error.message).to.equal('User not found for email nope@example.com');
  });
});

experiment('resetPassword - when reset guid has not been set before', async () => {
  let request;
  let response;
  let h;

  beforeEach(async () => {
    sandbox.stub(notify, 'sendPasswordResetEmail').resolves({});
    sandbox.stub(idm, 'updateResetGuid').resolves({});
    sandbox.stub(idm, 'getUserByUsername').resolves({
      err: null,
      data: [{
        user_id: 123,
        user_name: 'test@example.com'
      }]
    });

    request = getRequest('test@example.com');
    h = getResponseToolkitStub();

    response = await controller.resetPassword(request, h);
  });

  afterEach(async () => sandbox.restore());

  test('the reset guid is updated', async () => {
    expect(idm.updateResetGuid.args[0][0]).to.equal(123);
    expect(idm.updateResetGuid.args[0][1]).to.match(guidRegex);
  });

  test('a message is sent via notify', async () => {
    const paramsArg = notify.sendPasswordResetEmail.args[0][0];
    const mode = notify.sendPasswordResetEmail.args[0][1];

    expect(paramsArg.email).to.equal('test@example.com');
    expect(paramsArg.firstName).to.equal('(User)');
    expect(paramsArg.resetGuid).to.match(guidRegex);
    expect(mode).to.equal('reset');
  });

  test('the response has no error', async () => {
    expect(response.error).to.be.null();
  });

  test('the response contains the expected data', async () => {
    expect(response.data.user_id).to.equal(123);
    expect(response.data.user_name).to.equal('test@example.com');
    expect(response.data.reset_guid).to.match(guidRegex);
  });
});

experiment('resetPassword - when reset guid has been updated in the last 24 hours', async () => {
  let request;
  let response;
  let resetGuid;

  beforeEach(async () => {
    resetGuid = uuid();
    request = getRequest('test@example.com');

    sandbox.stub(idm, 'getUserByUsername').resolves({
      err: null,
      data: [{
        user_id: 123,
        user_name: 'test@example.com',
        reset_guid: resetGuid,
        reset_guid_date_created: moment().subtract(5, 'hours').toISOString()
      }]
    });
    sandbox.stub(idm, 'updateResetGuid').resolves({});
    sandbox.stub(notify, 'sendPasswordResetEmail').resolves({});

    response = await controller.resetPassword(request, getResponseToolkitStub());
  });

  afterEach(async () => sandbox.restore());

  test('the reset guid is not updated', async () => {
    expect(idm.updateResetGuid.called).to.be.false();
  });

  test('a message is sent via notify using the existing reset guid', async () => {
    const paramsArg = notify.sendPasswordResetEmail.args[0][0];
    const mode = notify.sendPasswordResetEmail.args[0][1];

    expect(paramsArg.email).to.equal('test@example.com');
    expect(paramsArg.firstName).to.equal('(User)');
    expect(paramsArg.resetGuid).to.equal(resetGuid);
    expect(mode).to.equal('reset');
  });

  test('the response has no error', async () => {
    expect(response.error).to.be.null();
  });

  test('the response contains the expected data', async () => {
    expect(response.data.user_id).to.equal(123);
    expect(response.data.user_name).to.equal('test@example.com');
    expect(response.data.reset_guid).to.match(guidRegex);
  });
});

experiment('resetPassword - when reset guid was last set over 1 day ago', async () => {
  let request;
  let response;

  beforeEach(async () => {
    request = getRequest('test@example.com');

    sandbox.stub(idm, 'updateResetGuid').resolves({});
    sandbox.stub(idm, 'getUserByUsername').resolves({
      err: null,
      data: [{
        user_id: 123,
        user_name: 'test@example.com',
        reset_guid: uuid(),
        reset_guid_date_created: moment().subtract(25, 'hours').toISOString()
      }]
    });
    sandbox.stub(notify, 'sendPasswordResetEmail').resolves({});

    response = await controller.resetPassword(request, getResponseToolkitStub());
  });

  afterEach(async () => sandbox.restore());

  test('the reset guid is updated', async () => {
    expect(idm.updateResetGuid.args[0][0]).to.equal(123);
    expect(idm.updateResetGuid.args[0][1]).to.match(guidRegex);
  });

  test('a message is sent via notify', async () => {
    const paramsArg = notify.sendPasswordResetEmail.args[0][0];
    const mode = notify.sendPasswordResetEmail.args[0][1];

    expect(paramsArg.email).to.equal('test@example.com');
    expect(paramsArg.firstName).to.equal('(User)');
    expect(paramsArg.resetGuid).to.match(guidRegex);
    expect(mode).to.equal('reset');
  });

  test('the response has no error', async () => {
    expect(response.error).to.be.null();
  });

  test('the response contains the expected data', async () => {
    expect(response.data.user_id).to.equal(123);
    expect(response.data.user_name).to.equal('test@example.com');
    expect(response.data.reset_guid).to.match(guidRegex);
  });
});
