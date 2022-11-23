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
const { v4: uuid } = require('uuid')
const { experiment, test, beforeEach, after } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const server = require('../index')
const { deleteTestUsers } = require('./test-helpers')

// A user is always created with testEmailOne as part of the beforeEach.
const testEmailOne = 'test1@example.com'

// This is reserved when needing to add an alternative/extra user
const testEmailTwo = 'test2@example.com'

// A list of test user IDs
const testUserIds = []

const createRequest = (method = 'GET', url = '/idm/1.0/user') => ({
  method,
  url,
  headers: { Authorization: process.env.JWT_TOKEN }
})

const createGetRequest = id => createRequest('GET', `/idm/1.0/user/${id}`)

const createTestUser = async (userName = testEmailOne, application = 'water_vml') => {
  const request = createRequest('POST')
  request.payload = {
    user_name: userName,
    application,
    password: uuid(),
    user_data: JSON.stringify({
      unitTest: true
    })
  }

  const response = await server.inject(request)

  // Store generated user ID
  const data = JSON.parse(response.payload)
  const userId = data.data?.user_id
  if (userId) {
    testUserIds.push(userId)
  }

  return response
}

experiment('Test users API', () => {
  // Always add the basic test user to the database before each
  // to simplify GET based tests
  beforeEach(async ({ context }) => {
    await deleteTestUsers()
    const response = await createTestUser()
    const payload = JSON.parse(response.payload)
    context.userId = payload.data.user_id
  })

  after(async () => {
    await deleteTestUsers()
  })

  test('The API should create a user', async ({ context }) => {
    const res = await createTestUser(testEmailTwo)
    expect(res.statusCode).to.equal(201)

    const payload = JSON.parse(res.payload)

    expect(payload.error).to.equal(null)
    expect(payload.data.user_id).to.be.a.number()
    expect(payload.data.user_name).to.equal(testEmailTwo)
    expect(payload.data.date_created).to.be.a.string()
    expect(payload.data.date_updated).to.be.a.string()
  })

  test('The API should get a user by ID', async ({ context }) => {
    const request = createGetRequest(context.userId)
    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)

    // Check payload
    const { error, data } = JSON.parse(response.payload)

    expect(error).to.equal(null)
    expect(data.user_name).to.equal(testEmailOne)
  })

  test('The API should get a list of users', async () => {
    const request = createRequest()
    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)

    const payload = JSON.parse(response.payload)
    expect(payload.error).to.equal(null)
    expect(payload.data).to.be.an.array()
  })

  test('It is not be possible to use the same email with one application', async () => {
    await createTestUser(testEmailTwo, 'water_vml')
    const response = await createTestUser(testEmailTwo, 'water_vml')
    expect(response.statusCode).to.equal(400)
  })

  test('It is possible to use the same email with across applications', async () => {
    const createVmlResponse = await createTestUser(testEmailTwo, 'water_vml')
    const createAdminResponse = await createTestUser(testEmailTwo, 'water_admin')
    expect(createVmlResponse.statusCode).to.equal(201)
    expect(createAdminResponse.statusCode).to.equal(201)
  })
})
