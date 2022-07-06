const repos = require('../../lib/repos')
const Boom = require('@hapi/boom')
const { get } = require('lodash')

const isRateLimitExceeded = row =>
  get(row, 'attempts') >= 3 || get(row, 'security_code_attempts') >= 3

const isVerified = row =>
  get(row, 'date_verified', null) !== null

const isLocked = row => isRateLimitExceeded(row) || isVerified(row)

/**
 * If the error is a Boom error, return a { data, error } response and
 * relevant HTTP code. Otherwise rethrow
 * @param  {Object} error - the error being handled
 * @param  {Object} h     - HAPI response toolkit
 * @return {Object} response
 */
const errorHandler = (error, h) => {
  if (error.isBoom) {
    console.log(error.message)
    return h.response({ data: null, error: error.message }).code(error.output.statusCode)
  }
  throw error
}

/**
 * Gets status of email change process
 */
const getStatus = async (request, h) => {
  const { userId } = request.params
  try {
    const data = await repos.changeEmailRepo.findOneByUserId(userId)
    if (!data) {
      throw Boom.notFound(`No email change record found for user ${userId}`)
    }
    return {
      data: {
        userId,
        email: data.new_email_address,
        isLocked: isLocked(data)
      },
      error: null
    }
  } catch (err) {
    return errorHandler(err, h)
  }
}

const validateEmailChange = (userId, emailChange) => {
  if (isRateLimitExceeded(emailChange)) {
    throw Boom.tooManyRequests(`User ${userId} - too many email change attempts`)
  }

  if (isVerified(emailChange)) {
    throw Boom.locked(`User ${userId} - already verified`)
  }
}

/**
 * Starts email change process
 */
const postStartEmailChange = async (request, h) => {
  const { userId } = request.params
  const { email } = request.payload

  try {
    // Rate limit requests
    const existing = await repos.changeEmailRepo.findOneByUserId(userId)

    validateEmailChange(userId, existing)

    // Upsert email change record
    const data = await repos.changeEmailRepo.create(userId, email)

    // Check for an existing user with the new email address
    const existingUser = await repos.usersRepo
      .findInSameApplication(userId, email)
    if (existingUser) {
      throw Boom.conflict(`User ${userId} - ${email} already exists`)
    }

    return {
      data: {
        userId,
        securityCode: data.security_code
      },
      error: null
    }
  } catch (err) {
    return errorHandler(err, h)
  }
}

/**
 * Completes email change process
 */
const postSecurityCode = async (request, h) => {
  const { userId } = request.params
  const { securityCode } = request.payload

  try {
    await repos.changeEmailRepo.incrementSecurityCodeAttempts(userId)

    // Rate limit requests to 3 per day
    const existing = await repos.changeEmailRepo.findOneByUserId(userId)

    if (!existing) {
      throw Boom.notFound(`User ${userId} - no record found, may have expired`)
    }

    validateEmailChange(userId, existing)

    if (securityCode !== existing.security_code) {
      throw Boom.unauthorized(`User ${userId} - wrong security code`)
    }

    // Update verified status of email change record
    await repos.changeEmailRepo.updateVerified(userId, securityCode)

    // Update the user
    const user = await repos.usersRepo.updateEmailAddress(userId, existing.new_email_address)

    return {
      data: {
        userId: user.user_id,
        email: user.user_name
      },
      error: null
    }
  } catch (err) {
    return errorHandler(err, h)
  }
}

module.exports = {
  postStartEmailChange,
  postSecurityCode,
  getStatus
}
