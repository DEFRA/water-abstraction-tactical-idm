const Joi = require('joi');
const { version } = require('../../config');
const controller = require('../controllers/user-roles');

module.exports = [
  {
    method: 'PUT',
    path: '/idm/' + version + '/user/{userId}/roles',
    handler: controller.putUserRoles,
    options: {
      validate: {
        params: Joi.object().keys({
          userId: Joi.number().integer().required()
        }),
        payload: Joi.object().keys({
          application: Joi.string().required(),
          roles: Joi.array().items(Joi.string()),
          groups: Joi.array().items(Joi.string())
        })
      }
    }
  }
];
