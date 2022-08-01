const HAPIRestAPI = require('@envage/hapi-pg-rest-api')
const Joi = require('joi')
const { omit } = require('lodash')

const { createHash } = require('../lib/helpers')

const { usersRepo } = require('../lib/repos')
const { pool } = require('../lib/connectors/db')
const { version } = require('../../config')

const restApi = new HAPIRestAPI({
  table: 'idm.users',
  primaryKey: 'user_id',
  endpoint: '/idm/' + version + '/user',
  connection: pool,
  primaryKeyAuto: true,
  primaryKeyGuid: false,
  postSelect: (data) => {
    return data.map(row => {
      // Don't include password in returned data
      const { password, ...rest } = row
      return rest
    })
  },
  preQuery: async (request) => {
    // Hash passwords found in data
    if ('password' in request.data) {
      request.data.password = await createHash(request.data.password)
    }
    if ('user_data' in request.data && typeof request.data.user_data !== 'string') {
      request.data.user_data = JSON.stringify(request.data.user_data)
    }
    if ('role' in request.data && typeof request.data.role !== 'string') {
      request.data.role = JSON.stringify(request.data.role)
    }
    return request
  },
  onCreateTimestamp: 'date_created',
  onUpdateTimestamp: 'date_updated',
  validation: {
    user_id: [Joi.number().required(), Joi.string().email().required().lowercase()],
    user_name: Joi.string().email().trim().lowercase(),
    password: Joi.string(),
    user_data: Joi.string(),
    reset_guid: Joi.string().guid().allow(null),
    reset_guid_date_created: Joi.string().allow(null),
    reset_required: Joi.number(),
    last_login: Joi.string(),
    bad_logins: Joi.number(),
    date_created: Joi.string().allow(null),
    date_updated: Joi.string().allow(null),
    application: Joi.string(),
    role: Joi.string().allow(null),
    external_id: Joi.string().allow(null),
    enabled: Joi.boolean()
  }
})

/**
 * Override find one handler
 * @param  {[type]}  request [description]
 * @param  {[type]}  h       [description]
 * @return {Promise}         [description]
 */
restApi.routes.findOneRoute.handler = async (request, h) => {
  const { id } = request.params

  const user = await usersRepo.findUserWithRoles(id)

  if (user) {
    return { error: null, data: omit(user, 'password') }
  }

  return h.response({
    error: 'User not found',
    data: null
  }).code(404)
}

module.exports = restApi.getRoutes()
