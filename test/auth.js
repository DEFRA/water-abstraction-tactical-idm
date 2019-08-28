/**
 * Test verification process
 * - Create entity
 * - Create company
 * - Create unverified document headers linked to entity/company
 * - Create verification code - update documents with ID
 * - Verify with auth code
 * - Update documents with verification ID to verified status
 */
'use strict';
const uuidv4 = require('uuid/v4');
const { experiment, test, before, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { deleteTestUsers } = require('./test-helpers');

const { expect } = require('@hapi/code');
const server = require('../index');

let createdEmails = [];

async function createUser (email, password, application = 'water_vml') {
  createdEmails.push(email);

  const request = {
    method: 'POST',
    url: `/idm/1.0/user`,
    headers: { Authorization: process.env.JWT_TOKEN },
    payload: {
      user_name: email,
      password,
      application,
      user_data: {
        unitTest: true
      }
    }
  };

  const res = await server.inject(request);
  expect(res.statusCode).to.equal(201);

  // Check payload
  const payload = JSON.parse(res.payload);

  expect(payload.error).to.equal(null);
  expect(payload.data.user_id).to.be.a.number();

  // Return user ID for future tests
  return payload.data.user_id;
}

async function getUser (userId) {
  const request = {
    method: 'GET',
    url: `/idm/1.0/user/${userId}`,
    headers: { Authorization: process.env.JWT_TOKEN }
  };

  const res = await server.inject(request);
  return res.result.data;
}

const buildRequest = (email, password, application) => ({
  method: 'POST',
  url: `/idm/1.0/user/login`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  },
  payload: {
    user_name: email,
    password,
    application
  }
});

experiment('Test authentication API', () => {
  before(async () => {
    await deleteTestUsers();
  });

  beforeEach(async ({ context }) => {
    createdEmails = [];
    context.email = 'unit-test-user@example.com';
    context.password = uuidv4();
    context.application = 'water_vml';
    context.userId = await createUser(context.email, context.password, context.application);
  });

  afterEach(async () => {
    await deleteTestUsers();
  });

  test('The API should allow authentication with correct password', async ({ context }) => {
    const { email, password, application } = context;
    const request = buildRequest(email, password, application);
    const res = await server.inject(request);
    expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.equal(null);
    expect(payload.user_id).to.equal(context.userId);
  });

  test('The API should ensure passwords are case sensitive', async ({ context }) => {
    const { email, password, application } = context;
    const request = buildRequest(email, password.toUpperCase(), application);

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.not.equal(null);
  });

  test('The API should allow authentication for admin user with admin account', async () => {
    // create a water_admin user
    const email = 'unit-test-admin@example.com';
    const password = uuidv4();
    const application = 'water_admin';

    const userId = await createUser(email, password, application);

    const request = buildRequest(email, password, application);

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.equal(null);
    expect(payload.user_id).to.equal(userId);
  });

  test('The API should prevent authentication with incorrect password', async ({ context }) => {
    const request = buildRequest(context.email, 'wrongpass', context.application);
    const res = await server.inject(request);
    expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);
    expect(payload.err).to.not.equal(null);
  });

  test('bad_logins is incremented on failed auth attempt', async ({ context }) => {
    const request = buildRequest(context.email, 'wrongpass', context.application);
    await server.inject(request);
    await server.inject(request);

    const user = await getUser(context.userId);
    expect(user.bad_logins).to.equal('2');
  });

  test('A user cannot use credentials for a different application', async ({ context }) => {
    const request = buildRequest(context.email, context.password, 'water_admin');
    const res = await server.inject(request);
    expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.not.equal(null);
  });
});
