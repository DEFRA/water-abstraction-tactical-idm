const repos = require('../../lib/repos');
const Boom = require('@hapi/boom');
const helpers = require('../../lib/helpers');

/**
 * If the error is a Boom error, return a { data, error } response and
 * relevant HTTP code. Otherwise rethrow
 * @param  {Object} error - the error being handled
 * @param  {Object} h     - HAPI response toolkit
 * @return {Object} response
 */
const errorHandler = (error, h) => {
  if (error.isBoom) {
    return h.response({ data: null, error: error.message }).code(error.output.statusCode);
  }
  throw error;
};

/**
 * Starts email change process:
 *   Checks number of attempts in last 24hrs
 *   Checks password entered
 *   Creates record in email change verifications table
 */
const startChangeEmailAddress = async (request, h) => {
  try {
    const { userId, password } = request.payload;

    // Find user
    const user = await repos.usersRepo.findById(userId);
    if (!user) {
      throw Boom.notFound(`User ${userId} not found`);
    }

    // Rate limit requests
    const { rowCount } = await repos.changeEmailRepo.findByUserId(userId);
    if (rowCount > 2) throw Boom.tooManyRequests(`Too many email change attempts - user ${userId}`);

    // Authenticate user
    const isAuthenticated = await helpers.testPassword(password, user.password);

    // Create verification record
    const verificationId = await repos.changeEmailRepo.createEmailChangeRecord(userId, isAuthenticated);

    return {
      data: { verificationId, authenticated: isAuthenticated },
      error: null
    };
  } catch (error) {
    return errorHandler(error, h);
  }
};

/**
 * Second step of email change process:
 *   Checks whether email address is already in use
 *   Updates record in email change verifications table with newEmail and code
 */
const createVerificationCode = async (request, h) => {
  try {
    const { email: newEmail, verificationId } = request.payload;

    // Check for an existing user with the new email address
    const existingUser = await repos.usersRepo
      .findExistingByVerificationId(verificationId, newEmail);

    if (existingUser) {
      throw Boom.conflict(`User ${newEmail} already exists`);
    }

    // Set the email address in the verification record
    const verificationCode = await repos.changeEmailRepo
      .updateEmailChangeRecord(verificationId, newEmail);

    if (!verificationCode) {
      throw Boom.unauthorized(`Verification ${verificationId} could not be updated`);
    }

    return {
      data: { verificationCode },
      error: null
    };
  } catch (error) {
    return errorHandler(error, h);
  }
};

/**
 * Final step of email change process:
 *   Checks whether there is a record with the code provided that is > 24hrs old
 *   Update the user_name in the users table
 */
const checkVerificationCode = async (request, h) => {
  const { userId, securityCode } = request.payload;

  try {
    // Find email verification record
    const emailChange = await repos.changeEmailRepo
      .findOneByVerificationCode(userId, securityCode);

    if (!emailChange) {
      await repos.changeEmailRepo.incrementAttemptCounter(userId);
      throw Boom.unauthorized(`Invalid/expired security code for user ${userId}`);
    }

    // Update the user
    const { new_email_address: newEmail } = emailChange;
    const user = await repos.usersRepo.updateEmailAddress(userId, newEmail);

    if (!user) {
      throw Boom.notFound(`User ${userId} code could not be found`);
    }

    // Set date verified to prevent reuse
    await repos.changeEmailRepo.updateDateVerified(emailChange);

    return {
      data: { newEmail, userId },
      error: null
    };
  } catch (error) {
    return errorHandler(error, h);
  }
};

module.exports = {
  startChangeEmailAddress,
  createVerificationCode,
  checkVerificationCode
};
