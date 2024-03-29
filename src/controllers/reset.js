const repos = require('../lib/repos')
const moment = require('moment')
const { v4: uuid } = require('uuid')
const notify = require('../lib/connectors/notify')
const { logger } = require('../logger')

class UserNotFoundError extends Error {
  constructor (message) {
    super(message)
    this.name = 'UserNotFoundError'
  }
}

class NotifyError extends Error {
  constructor (message) {
    super(message)
    this.name = 'NotifyError'
  }
}

const shouldUpdateUserResetGuid = user => {
  const { reset_guid: guid, reset_guid_date_created: created } = user

  if (guid && moment(created).isAfter(moment().subtract(1, 'day'))) {
    return false
  }
  return true
}

const sendPasswordResetEmail = async (user, resetGuid, sender, mode) => {
  const firstName = user.user_data?.firstName ? user.user_data.firstName : '(User)'

  const { err } = await notify.sendPasswordResetEmail({
    email: user.user_name,
    firstName,
    resetGuid,
    sender,
    userApplication: user.application
  }, mode)

  if (err) {
    throw new NotifyError(err)
  }
}

const createResetPasswordResponse = (user, resetGuid) => ({
  error: null,
  data: { reset_guid: resetGuid, user_name: user.user_name, user_id: user.user_id }
})

const errorHandler = (request, h, error) => {
  if (error.name === 'UserNotFoundError') {
    request.log('info', error)
    return h.response({ data: null, error }).code(404)
  }

  logger.error('resetPassword error', error.stack)
  return h.response({ data: null, error }).code(500)
}

/**
 * Checks that the user exists and is enabled
 * @param  {Object} user
 * @return {Boolean}
 */
const validateUser = user => user && user.enabled

/**
 * Reset password and send email
 * Modes can be:
 * - reset : user initiated reset process
 * - new : new user creating an account for the first time
 * - existing : user trying to create account, but account already exists
 * - sharing : a user is being invited by another user to share access
 *
 * @param {String} request.params.email - user's email address
 * @param {String} [request.params.sender] - email address of the sender, sharing only
 * @param {String} request.query.mode - mode
 */
const resetPassword = async (request, h) => {
  const mode = request.query.mode || 'reset'
  const sender = request.query.sender || null
  const { email, application } = request.params

  try {
    // Find user
    const user = await repos.usersRepo.findByUsername(email, application)
    if (!validateUser(user)) {
      throw new UserNotFoundError(`User not found for email ${email}`)
    }
    let resetGuid = user.reset_guid

    if (shouldUpdateUserResetGuid(user)) {
      request.log('info', `user (${user.user_id}) needs a new reset guid`)
      resetGuid = uuid()
      await repos.usersRepo.updateResetGuid(user.user_id, resetGuid)
    }

    await sendPasswordResetEmail(user, resetGuid, sender, mode)

    return createResetPasswordResponse(user, resetGuid)
  } catch (error) {
    return errorHandler(request, h, error)
  }
}

module.exports = {
  resetPassword
}
