/* API operations only - NO UI */
const Joi = require('joi');
const IDM = require('../lib/idm');
const { version } = require('../../config');
const { pool } = require('../lib/connectors/db');
const apiConfig = {
  pool,
  version
};

const resetController = require('../controllers/reset');
const UsersController = require('../controllers/user')(apiConfig);
const KpiApi = require('../controllers/kpi-reports.js')(apiConfig);

module.exports = [
  {
    method: 'GET',
    path: '/status',
    handler: () => 'ok',
    options: {
      auth: false,
      description: 'Status placeholder'
    }
  },
  ...UsersController.getRoutes(),
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
    method: 'POST',
    path: '/idm/' + version + '/user/login',
    handler: IDM.loginUser,
    options: {
      description: 'Login users, responds with user details',
      validate: {
        payload: {
          user_name: Joi.string().required(),
          password: Joi.string().required(),
          application: Joi.string().required()
        }
      }
    }
  },
  {
    method: '*',
    path: '/', // catch-all path
    handler: (request, h) => h.code(404)
  },
  KpiApi.findManyRoute()
];
