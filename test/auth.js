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
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');
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
      application
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

async function deleteUsers () {
  const requests = createdEmails.map(email => ({
    method: 'DELETE',
    url: `/idm/1.0/user/${email}`,
    headers: { Authorization: process.env.JWT_TOKEN }
  })).map(request => server.inject(request));

  await Promise.all(requests);
}

lab.experiment('Test authentication API', () => {
  lab.beforeEach(async({ context }) => {
    createdEmails = [];
    context.email = 'unit-test-user@example.com';
    context.password = uuidv4();
    context.application = 'water_vml';
    context.userId = await createUser(context.email, context.password, context.application);
  });

  lab.afterEach(async() => {
    await deleteUsers();
  });

  lab.test('The API should allow authentication with correct password', async ({ context }) => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/login`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: context.email,
        password: context.password,
        application: context.application
      }
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.equal(null);
    expect(payload.user_id).to.equal(context.userId);
  });

  lab.test('The API should ensure passwords are case sensitive', async ({ context }) => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/login`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: context.email,
        password: context.password.toUpperCase(),
        application: context.application
      }
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.not.equal(null);
  });

  lab.test('The API should allow authentication for admin user with admin account', async() => {
    // create a water_admin user
    const email = 'unit-test-admin@example.com';
    const password = uuidv4();
    const application = 'water_admin';

    const userId = await createUser(email, password, application);

    const request = {
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
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.equal(null);
    expect(payload.user_id).to.equal(userId);
  });

  lab.test('The API should prevent authentication with incorrect password', async ({ context }) => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/login`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: context.email,
        password: 'wrongpass',
        application: context.application
      }
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.not.equal(null);
  });

  lab.test('A user cannot use credentials for a different application', async({ context }) => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/login`,
      headers: { Authorization: process.env.JWT_TOKEN },
      payload: {
        user_name: context.email,
        password: context.password,
        application: 'water_admin'
      }
    };

    const res = await server.inject(request);
    expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    expect(payload.err).to.not.equal(null);
  });
});
