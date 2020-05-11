const repos = require('../../lib/repos');
const Boom = require('@hapi/boom');

/**
 * If the error is a Boom error, return a { data, error } response and
 * relevant HTTP code. Otherwise rethrow
 * @param  {Object} error - the error being handled
 * @param  {Object} h     - HAPI response toolkit
 * @return {Object} response
 */
const errorHandler = (error, h) => {
  if (error.isBoom) {
    console.log(error.message);
    return h.response({ data: null, error: error.message }).code(error.output.statusCode);
  }
  throw error;
};

/**
 * Gets an array of registrations by month by application for a given year
 * and the total number of users by application is appended to the end of the array
 */
const getRegistrations = async (request, h) => {
  const { year } = request.params;
  try {
    const data = await repos.usersRepo.findRegistrationsByMonth(year);
    if (!data) {
      throw Boom.notFound('No data found from users table');
    }
    return {
      data,
      error: null
    };
  } catch (err) {
    return errorHandler(err, h);
  }
};

module.exports = {
  getRegistrations
};
