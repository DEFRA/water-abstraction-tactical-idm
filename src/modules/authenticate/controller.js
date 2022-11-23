const Boom = require('@hapi/boom')
const { v4: uuid } = require('uuid')

const repos = require('../../lib/repos')
const helpers = require('../../lib/helpers')
const { logger } = require('../../logger')
const Notify = require('../../lib/connectors/notify')

/**
 * Error handler for requests.
 * If error is < 500, we always respond with 401
 * @param  {[type]} err [description]
 * @param  {[type]} h   [description]
 * @return {[type]}     [description]
 */
const errorHandler = (err, h) => {
  const statusCode = err.output?.statusCode ? err.output.statusCode : 500

  if (statusCode < 500) {
    logger.info(err.message)
    return h.response({
      user_id: null,
      err: 'Unknown user name or password'
    }).code(401)
  }
  logger.error('IDM login error', err.stack)
  throw err
}

/**
 * Sends a password lock email to the user specified with their new reset GUID
 * This occurs when they have done >10 bad logins
 * @param  {Object} user      - user record from idm.users
 * @param  {String} resetGuid - the reset GUID used in the URL sent for reset
 * @return {<Promise>}          resolves when message sent
 */
const sendPasswordLockEmail = (user, resetGuid) => {
  const firstname = user.user_data?.firstname ? user.user_data.firstname : 'User'

  return Notify.sendPasswordLockEmail({
    email: user.user_name,
    firstname,
    resetGuid,
    userApplication: user.application
  })
}

/**
 * Maps the user record to the HTTP response
 * @param  {[type]} user [description]
 * @return {[type]}      [description]
 */
const mapUserResponse = user => {
  delete user.password
  return {
    ...user,
    err: null
  }
}

/**
 * Handles a bad login attempt.
 * Increments the bad login count, and if the counter reaches exactly 10,
 * the user's password is voided and a reset email sent to the user
 * @param  {Object}  user
 * @return {Promise} resolves when bad login attempt has been handled
 */
const handleBadLogin = async user => {
  const { bad_logins: lockCount } = await repos.usersRepo.incrementLockCount(user.user_id)
  if (parseInt(lockCount) === 10) {
    // When 10 bad logins reached, reset password and send email
    const resetGuid = uuid()
    return Promise.all([
      repos.usersRepo.voidCurrentPassword(user.user_id, resetGuid),
      sendPasswordLockEmail(user, resetGuid)
    ])
  }
}

/**
 * POST - authenticate
 * @param {String} request.payload.user_name - the user's email address
 * @param {String} request.payload.application - water_vml|water_admin|water_dev
 * @param {String} request.payload.password
 */
const postAuthenticate = async (request, h) => {
  const { user_name: userName, password, application } = request.payload

  try {
    // Find user
    const user = await repos.usersRepo.findByUsername(userName, application)
    if (!user) {
      throw Boom.notFound(`User ${userName} not found`)
    }

    // Is user enabled?
    if (!user.enabled) {
      throw Boom.locked(`User account ${userName} is disabled`)
    }

    // Check submitted password
    const isAuthenticated = await helpers.testPassword(password, user.password)

    if (!isAuthenticated) {
      await handleBadLogin(user)
      throw Boom.unauthorized(`User ${userName} unauthorized`)
    }

    // Update user last login time / reset login count
    const updatedUser = await repos.usersRepo.updateAuthenticatedUser(user.user_id)
    return mapUserResponse(updatedUser)
  } catch (err) {
    return errorHandler(err, h)
  }
}

exports.postAuthenticate = postAuthenticate
