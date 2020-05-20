const repos = require('../../lib/repos');
const Boom = require('@hapi/boom');
const { mapRegistrations } = require('./lib/mapper');
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
 * Registrations KPI data for KPI UI for the service
 * @param {*} request
 * @param {*} h
 * @return {Array} returns an array of objects listing the registrations counted by
 * application for all time then broken down by month for the current year
 */
const getRegistrations = async (request, h) => {
  try {
    const repoData = await repos.usersRepo.findRegistrationsByMonth();
    if (!repoData) {
      console.log('in the sphere of errors');
      throw Boom.notFound('No data found from users table');
    }
    const data = mapRegistrations(repoData);
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
