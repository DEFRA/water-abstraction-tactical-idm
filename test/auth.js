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

const testEmail = 'user@example.com';
const adminEmail = 'admin@example.com';
const testPassword = uuidv4();
const adminPassword = uuidv4();
let userId, adminUserId;

async function createUser (email, password, isAdmin = false) {
  const request = {
    method: 'POST',
    url: `/idm/1.0/user`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    payload: {
      user_name: email,
      password,
      admin: isAdmin ? 1 : 0
    }
  };

  const res = await server.inject(request);
  Code.expect(res.statusCode).to.equal(201);

  // Check payload
  const payload = JSON.parse(res.payload);

  Code.expect(payload.error).to.equal(null);
  Code.expect(payload.data.user_id).to.be.a.number();

  // Return user ID for future tests
  return payload.data.user_id;
}

async function deleteUser (email) {
  // Find user by email
  const request = {
    method: 'DELETE',
    url: `/idm/1.0/user/${email}`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  };
  await server.inject(request);
}

lab.experiment('Test authentication API', () => {
  lab.before(async() => {
    userId = await createUser(testEmail, testPassword);
    adminUserId = await createUser(adminEmail, adminPassword, true);
  });

  lab.after(async() => {
    await deleteUser(testEmail);
    await deleteUser(adminEmail);
  });

  lab.test('The API should allow authentication with correct password', async () => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/login`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: testEmail,
        password: testPassword
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.err).to.equal(null);
    Code.expect(payload.user_id).to.equal(userId);
  });

  lab.test('The API should allow authentication for admin user with admin account', async() => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/loginAdmin`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: adminEmail,
        password: adminPassword
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(200);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.err).to.equal(null);
    Code.expect(payload.user_id).to.equal(adminUserId);
  });

  lab.test('The API should prevent authentication with incorrect password', async () => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/login`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: testEmail,
        password: 'wrongpass'
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.err).to.not.equal(null);
  });

  lab.test('The API should prevent admin authentication with incorrect password', async () => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/loginAdmin`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: adminEmail,
        password: 'wrongpass'
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.err).to.not.equal(null);
  });

  lab.test('The API should prevent admin authentication with non-admin account', async() => {
    const request = {
      method: 'POST',
      url: `/idm/1.0/user/loginAdmin`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      },
      payload: {
        user_name: testEmail,
        password: testPassword
      }
    };

    const res = await server.inject(request);
    Code.expect(res.statusCode).to.equal(401);

    // Check payload
    const payload = JSON.parse(res.payload);

    Code.expect(payload.err).to.not.equal(null);
  });
});
