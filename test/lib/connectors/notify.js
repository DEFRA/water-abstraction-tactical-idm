const { expect } = require('@hapi/code')
const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const helpers = require('@envage/water-abstraction-helpers')

const config = require('../../../config')
const notify = require('../../../src/lib/connectors/notify')
const { logger } = require('../../../src/logger')

const response = { foo: 'bar' }
const params = {
  email: 'bob@example.com',
  resetGuid: '123-abc',
  firstName: 'bob',
  sender: 'test-sender',
  userApplication: 'water_vml'
}

experiment('notify connectors', () => {
  beforeEach(async () => {
    sandbox.stub(helpers.serviceRequest, 'post').resolves(response)
    sandbox.stub(logger, 'error')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('sendNotifyMessage', () => {
    test('calls serviceRequest.post with correct arguments', async () => {
      await notify.sendPasswordResetEmail(params)
      const [uri, options] = helpers.serviceRequest.post.lastCall.args
      expect(uri).to.equal(`${config.services.water}/notify/password_reset_email`)
      expect(options).to.equal({
        body: {
          recipient: params.email,
          personalisation: {
            firstname: params.firstName,
            reset_url: `http://127.0.0.1:8000/reset_password_change_password?resetGuid=${params.resetGuid}`
          }
        }
      })
    })

    test('resolves with the response from the POST request', async () => {
      const data = await notify.sendPasswordResetEmail(params)
      expect(data).to.equal(response)
    })

    experiment('when the POST fails', () => {
      beforeEach(async () => {
        helpers.serviceRequest.post.rejects()
      })

      test('throws and logs an error', async () => {
        const func = () => notify.sendPasswordResetEmail(params)
        await expect(func()).to.reject()
        expect(logger.error.callCount).to.equal(1)
      })
    })
  })

  experiment('sendPasswordLockEmail', () => {
    test('calls serviceRequest.post with correct arguments', async () => {
      await notify.sendPasswordLockEmail(params)
      const [uri, options] = helpers.serviceRequest.post.lastCall.args
      expect(uri).to.equal(`${config.services.water}/notify/password_locked_email`)
      expect(options).to.equal({
        body: {
          recipient: params.email,
          personalisation: {
            firstname: params.firstName,
            reset_url: `http://127.0.0.1:8000/reset_password_change_password?resetGuid=${params.resetGuid}`
          }
        }
      })
    })

    test('resolves with the response from the POST request', async () => {
      const data = await notify.sendPasswordLockEmail(params)
      expect(data).to.be.true()
    })

    experiment('when the POST fails', () => {
      beforeEach(async () => {
        helpers.serviceRequest.post.rejects()
      })

      test('throws and logs an error', async () => {
        const func = () => notify.sendPasswordLockEmail(params)
        await expect(func()).to.reject()
        expect(logger.error.callCount).to.equal(3)
      })
    })
  })
})
