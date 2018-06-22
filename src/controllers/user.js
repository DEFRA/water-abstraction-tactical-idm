const HAPIRestAPI = require('hapi-pg-rest-api');
const Joi = require('joi');
const { createHash } = require('../lib/helpers');

module.exports = (config = {}) => {
  const {pool, version} = config;
  return new HAPIRestAPI({
    table: 'idm.users',
    primaryKey: 'user_id',
    endpoint: '/idm/' + version + '/user',
    connection: pool,
    primaryKeyAuto: true,
    primaryKeyGuid: false,
    postSelect: (data) => {
      return data.map(row => {
        // Don't include password in returned data
        const {password, ...rest} = row;
        return rest;
      });
    },
    preQuery: async(request) => {
      // Hash passwords found in data
      if ('password' in request.data) {
        request.data.password = await createHash(request.data.password);
      }
      // Support find user by ID or email
      if ('user_id' in request.filter) {
        if (request.filter.user_id.match(/@/)) {
          request.filter.user_name = request.filter.user_id;
          delete request.filter.user_id;
        }
      }
      return request;
    },
    validation: {
      user_id: [Joi.number().required(), Joi.string().email().required().lowercase()],
      user_name: Joi.string().email().trim().lowercase(),
      password: Joi.string(),
      admin: Joi.number(),
      user_data: Joi.object(),
      reset_guid: Joi.string().guid().allow(null),
      reset_required: Joi.number(),
      last_login: Joi.string(),
      bad_logins: Joi.number()
    }
  });
};
