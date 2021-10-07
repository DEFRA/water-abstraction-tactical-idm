const Joi = require('joi');
const controller = require('./controller');
const { version } = require('../../../config');

module.exports = [
  {
    method: 'POST',
    path: '/idm/' + version + '/user/login',
    handler: controller.postAuthenticate,
    options: {
      description: 'Login users, responds with user details',
      validate: {
        payload: Joi.object().keys({
          user_name: Joi.string().required(),
          password: Joi.string().required(),
          application: Joi.string().required()
        })
      }
    }
  }
];
