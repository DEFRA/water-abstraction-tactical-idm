/* API operations only - NO UI */
const Joi = require('@hapi/joi');
const { version } = require('../../config');
const { pool } = require('../lib/connectors/db');
const apiConfig = {
  pool,
  version
};

const resetController = require('../controllers/reset');
const usersRoutes = require('../controllers/user');
const KpiApi = require('../controllers/kpi-reports.js')(apiConfig);
const statusController = require('../controllers/status');
const userRolesRoutes = require('./user-roles');

module.exports = [
  {
    method: 'GET',
    path: '/status',
    handler: statusController.getStatus,
    options: {
      auth: false,
      description: 'Status placeholder'
    }
  },
  ...usersRoutes,
  {
    method: 'PATCH',
    path: '/idm/' + version + '/reset/{application}/{email}',
    handler: resetController.resetPassword,
    options: {
      validate: {
        params: {
          email: Joi.string().email().required(),
          application: Joi.string().required()
        },
        query: {
          mode: Joi.string().valid('reset', 'new', 'existing', 'sharing'),
          sender: Joi.string().email()
        }
      },
      description: 'Reset user password and send one of a selection of reset emails'
    }
  },
  {
    method: '*',
    path: '/', // catch-all path
    handler: (request, h) => h.code(404)
  },
  KpiApi.findManyRoute(),
  ...require('../modules/change-email/routes'),
  ...require('../modules/reauthentication/routes'),
  ...require('../modules/authenticate/routes'),
  ...userRolesRoutes
];
