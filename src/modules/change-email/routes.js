const Joi = require('joi');
const { version } = require('../../../config');
const controller = require('./controller');

const VALID_USER_ID = Joi.number().positive().required();
const VALID_PASSWORD = Joi.string().required();
const VALID_GUID = Joi.string().guid().required();
const VALID_SECURITY_CODE = Joi.number().positive().required();
const VALID_EMAIL = Joi.string().email().required();

module.exports = [{
  method: 'POST',
  path: '/idm/' + version + '/user/change-email-address/start',
  handler: controller.startChangeEmailAddress,
  options: {
    description: 'Get verification code for email change and send to new email',
    validate: {
      payload: {
        userId: VALID_USER_ID,
        password: VALID_PASSWORD
      }
    }
  }
},
{
  method: 'PATCH',
  path: '/idm/' + version + '/user/change-email-address/create-code',
  handler: controller.createVerificationCode,
  options: {
    description: 'Get verification code for email change and send to new email',
    validate: {
      payload: {
        verificationId: VALID_GUID,
        email: VALID_EMAIL
      }
    }
  }
},
{
  method: 'POST',
  path: '/idm/' + version + '/user/change-email-address/complete',
  handler: controller.checkVerificationCode,
  options: {
    description: 'Check verification code submitted by user, if matches, update user email',
    validate: {
      payload: {
        userId: VALID_USER_ID,
        securityCode: VALID_SECURITY_CODE
      }
    }
  }
}];
