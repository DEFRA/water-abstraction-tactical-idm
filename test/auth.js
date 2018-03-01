/**
 * Test verification process
 * - Create entity
 * - Create company
 * - Create unverified document headers linked to entity/company
 * - Create verification code - update documents with ID
 * - Verify with auth code
 * - Update documents with verification ID to verified status
 */
'use strict'
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const moment = require('moment');

const Code = require('code');
const server = require('../index');

const { createGUID } = require('../src/lib/helpers');

const testEmail = 'test@example.com';
const testPassword = createGUID();
let userId;


async function createTestUser() {
  const request = {
    method: 'POST',
    url: `/idm/1.0/user`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    payload: {
      user_name : testEmail,
      password : testPassword
    }
  }

  const res = await server.inject(request);
  Code.expect(res.statusCode).to.equal(201);

  // Check payload
  const payload = JSON.parse(res.payload);

  Code.expect(payload.error).to.equal(null);
  Code.expect(payload.data.user_id).to.be.a.number();

  // Store user ID for future tests
  userId = payload.data.user_id;
}


async function deleteTestUser() {
  // Find user by email
  const request = {
    method: 'DELETE',
    url: `/idm/1.0/user/${ testEmail }`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  }

  return await server.inject(request);
}



lab.experiment('Test authentication API', () => {

  lab.before(async() => {
    await deleteTestUser();
    await createTestUser();
    return;
  });

  lab.after(deleteTestUser);

  lab.test('The API should allow authentication with correct password', async () => {

    const request = {
      method: 'POST',
      url: `/idm/1.0/user/login`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name : testEmail,
        password : testPassword
      }
    }

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.err).to.equal(null);
    Code.expect(payload.user_id).to.equal(userId);
  })

  lab.test('The API should prevent authentication with incorrect password', async () => {

    const request = {
      method: 'POST',
      url: `/idm/1.0/user/login`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name : testEmail,
        password : 'wrongpass'
      }
    }

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.err).to.not.equal(null);
  })


})
