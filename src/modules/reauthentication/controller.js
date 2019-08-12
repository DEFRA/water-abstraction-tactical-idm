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
 * @param {Number} request.params.userId
 * @param {String} request.payload.password
 */
const postReauthenticate = async (request, h) => {
  const { userId } = request.params;
  const { password } = request.payload;

  try {
    // Find user
    const user = await repos.usersRepo.findById(userId);

    if (!user) {
      throw Boom.notFound(`User ${userId} not found`);
    }

    // Find reauth record for user ID today
    const reauth = await repos.reauthRepo.findByUserId(userId);

    // Limit attempts per day
    if (reauth.attempts > 10) {
      throw Boom.tooManyRequests(`Too many reauthentication attempts - user ${userId}`);
    }

    // Check submitted password
    const isAuthenticated = await helpers.testPassword(password, user.password);

    if (isAuthenticated) {
      await repos.reauthRepo.resetAttemptCounter(userId);
      return { data: { userId }, error: null };
    }

    throw Boom.unauthorized(`Incorrect password - user ${userId}`);
  } catch (err) {
    return errorHandler(err, h);
  }
};

exports.postReauthenticate = postReauthenticate;
