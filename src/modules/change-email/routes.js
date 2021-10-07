const Joi = require('joi');
const { version } = require('../../../config');
const controller = require('./controller');

const SECURITY_CODE_REGEX = /^[0-9]{6}$/;

const VALID_USER_ID = Joi.number().positive().required();
const VALID_SECURITY_CODE = Joi.string().regex(SECURITY_CODE_REGEX).required();
const VALID_EMAIL = Joi.string().email().required();

module.exports = [{
  method: 'POST',
  path: '/idm/' + version + '/user/{userId}/change-email-address',
  handler: controller.postStartEmailChange,
  options: {
    description: 'Starts the process of changing user email address',
    validate: {
      params: Joi.object().keys({
        userId: VALID_USER_ID
      }),
      payload: Joi.object().keys({
        email: VALID_EMAIL
      })
    }
  }
},
{
  method: 'POST',
  path: '/idm/' + version + '/user/{userId}/change-email-address/code',
  handler: controller.postSecurityCode,
  options: {
    description: 'Completes the process of changing user email address',
    validate: {
      params: Joi.object().keys({
        userId: VALID_USER_ID
      }),
      payload: Joi.object().keys({
        securityCode: VALID_SECURITY_CODE
      })
    }
  }
},
{
  method: 'GET',
  path: '/idm/' + version + '/user/{userId}/change-email-address',
  handler: controller.getStatus,
  options: {
    description: 'Gets status of the email address process',
    validate: {
      params: Joi.object().keys({
        userId: VALID_USER_ID
      })
    }
  }
}

];
