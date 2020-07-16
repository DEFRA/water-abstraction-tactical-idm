const repos = require('../../lib/repos');
const Boom = require('@hapi/boom');
const { mapRegistrations } = require('./lib/mapper');

/**
 * Registrations KPI data for KPI UI for the service
 * @param {*} request
 * @param {*} h
 * @return {Array} returns an array of objects listing the registrations counted by
 * application for all time then broken down by month for the current year
 */
const getRegistrations = async (request, h) => {
  const repoData = await repos.usersRepo.findRegistrationsByMonth();
  if (!repoData) {
    return Boom.notFound('No data found from users table');
  }
  const data = mapRegistrations(repoData);
  return { data };
};

module.exports = {
  getRegistrations
};
