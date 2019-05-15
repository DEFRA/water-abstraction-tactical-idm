const HAPIRestAPI = require('@envage/hapi-pg-rest-api');

module.exports = (config = {}) => {
  const { pool, version } = config;
  return new HAPIRestAPI({
    table: 'idm.kpi_view',
    endpoint: '/idm/' + version + '/kpi',
    connection: pool,
    validation: {}
  });
};
