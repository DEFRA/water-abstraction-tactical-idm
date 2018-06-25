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

const Code = require('code');
const server = require('../index');

const testEmail = 'test@example.com';
const testPassword = uuidv4();
let userId;

async function deleteTestUser () {
  // Find user by email
  const request = {
    method: 'DELETE',
    url: `/idm/1.0/user/${testEmail}`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  };
  await server.inject(request);
}

lab.experiment('Test users API', () => {
  // Delete test user if they exists
  lab.before(deleteTestUser);
  lab.after(deleteTestUser);

  lab.test('The API should create a user', async () => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: testEmail,
        password: testPassword
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(201);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.error).to.equal(null);
    Code.expect(payload.data.user_id).to.be.a.number();

    // Store user ID for future tests
    userId = payload.data.user_id;
  });

  lab.test('The API should get a user by ID', async () => {
    const request = {
      method: 'GET',
      url: `/idm/1.0/user/${userId}`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.error).to.equal(null);
    Code.expect(payload.data.user_name).to.equal(testEmail);
  });

  lab.test('The API should get a user by email address', async () => {
    const request = {
      method: 'GET',
      url: `/idm/1.0/user/${testEmail}`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.error).to.equal(null);
    Code.expect(payload.data.user_id).to.equal(userId);
  });

  lab.test('The API should get a list of users', async () => {
    const request = {
      method: 'GET',
      url: `/idm/1.0/user`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.error).to.equal(null);
    Code.expect(payload.data).to.be.an.array();
  });
});
