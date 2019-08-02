const Joi = require('joi');
const { version } = require('../../../config');
const controller = require('./controller');

module.exports = [{
  method: 'POST',
  path: '/idm/' + version + '/user/change-email-address/start',
  handler: controller.startChangeEmailAddress,
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
  handler: controller.createVerificationCode,
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
  handler: controller.checkVerificationCode,
  options: {
    description: 'Check verification code submitted by user, if matches, update user email',
    validate: {
      payload: {
        userId: Joi.number().positive().required(),
        securityCode: Joi.number().positive().required()
      }
    }
  }
}];
