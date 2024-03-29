const Joi = require('joi')
const controller = require('./controller')

const VALID_USER_ID = Joi.number().positive().required()
const VALID_PASSWORD = Joi.string().required()

module.exports = [
  {
    path: '/idm/1.0/user/{userId}/reauthenticate',
    method: 'POST',
    handler: controller.postReauthenticate,
    options: {
      description: 'User reauthenticating with their password',
      validate: {
        params: Joi.object().keys({
          userId: VALID_USER_ID
        }),
        payload: Joi.object().keys({
          password: VALID_PASSWORD
        })
      }
    }
  }
]
