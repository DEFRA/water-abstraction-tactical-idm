/* API operations only - NO UI */
const Joi = require('@hapi/joi');
const IDM = require('../lib/idm');
const { version } = require('../../config');
const { pool } = require('../lib/connectors/db');
const apiConfig = {
  pool,
  version
};

const resetController = require('../controllers/reset');
const changeEmailController = require('../controllers/change-email');
const usersRoutes = require('../controllers/user');
const KpiApi = require('../controllers/kpi-reports.js')(apiConfig);
const statusController = require('../controllers/status');

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
    method: 'POST',
    path: '/idm/' + version + '/user/change-email-address/start',
    handler: changeEmailController.startChangeEmailAddress,
    options: {
      description: 'Get verification code for email change and send to new email',
      validate: {
        payload: {
          userId: Joi.number().positive().required(),
          password: Joi.string().required()
        }
      }
    }
  },
  {
    method: 'PATCH',
    path: '/idm/' + version + '/user/change-email-address/create-code',
    handler: changeEmailController.createVerificationCode,
    options: {
      description: 'Get verification code for email change and send to new email',
      validate: {
        payload: {
          verificationId: Joi.string().guid().required(),
          email: Joi.string().email().required()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/idm/' + version + '/user/change-email-address/complete',
    handler: changeEmailController.checkVerificationCode,
    options: {
      description: 'Check verification code submitted by user, if matches, update user email',
      validate: {
        payload: {
          userId: Joi.number().positive().required(),
          securityCode: Joi.number().positive().required()
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
