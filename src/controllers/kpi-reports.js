const HAPIRestAPI = require('hapi-pg-rest-api');
const Joi = require('joi');

module.exports = (config = {}) => {
  const {pool, version} = config;
  return new HAPIRestAPI({
    table : 'idm.kpi_view',
    endpoint : '/idm/' + version + '/kpi',
    connection : pool,
    validation:{}
  });
}
