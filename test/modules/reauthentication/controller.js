const controller = require('../../../src/modules/reauthentication/controller')
const repos = require('../../../src/lib/repos')
const helpers = require('../../../src/lib/helpers')
const { expect } = require('@hapi/code')
const { test, experiment, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const userId = 123

const createRequest = () => ({
  params: {
    userId
  },
  payload: {
    password: 'test-password'
  }
})

experiment('reauthentication controller', () => {
  let h, code, request

  beforeEach(async () => {
    code = sandbox.stub()
    h = {
      response: sandbox.stub().returns({ code })
    }
    request = createRequest()
    sandbox.stub(repos.reauthRepo, 'findByUserId').resolves({
      attempts: 9
    })
    sandbox.stub(repos.reauthRepo, 'resetAttemptCounter')
    sandbox.stub(repos.usersRepo, 'findById').resolves({
      user_id: userId
    })
    sandbox.stub(helpers, 'testPassword')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('postReauthenticate', () => {
    test('throws a 404 error if user not found', async () => {
      repos.usersRepo.findById.resolves()
      await controller.postReauthenticate(request, h)
      const response = h.response.lastCall.args[0]
      expect(response.data).to.equal(null)
      expect(response.error).to.equal('User 123 not found')
      expect(code.calledWith(404)).to.equal(true)
    })

    test('throws a 429 error if too many incorrect reauthentication attempts', async () => {
      repos.reauthRepo.findByUserId.resolves({
        attempts: 11
      })
      await controller.postReauthenticate(request, h)
      const response = h.response.lastCall.args[0]
      expect(response.data).to.equal(null)
      expect(response.error).to.equal('Too many reauthentication attempts - user 123')
      expect(code.calledWith(429)).to.equal(true)
    })

    test('throws a 401 if incorrect password', async () => {
      helpers.testPassword.resolves(false)
      await controller.postReauthenticate(request, h)
      const response = h.response.lastCall.args[0]
      expect(response.data).to.equal(null)
      expect(response.error).to.equal('Incorrect password - user 123')
      expect(code.calledWith(401)).to.equal(true)
    })

    test('resets attempt counter and responds with user ID if password OK', async () => {
      helpers.testPassword.resolves(true)
      const response = await controller.postReauthenticate(request, h)
      expect(
        repos.reauthRepo.resetAttemptCounter.calledWith(userId)
      ).to.equal(true)
      expect(response).to.equal({
        data: {
          userId
        },
        error: null
      })
    })

    test('throws unhandled errors', async () => {
      repos.usersRepo.findById.rejects()
      const func = () => controller.postReauthenticate(request, h)
      expect(func()).to.reject()
    })
  })
})
