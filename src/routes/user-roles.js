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
        params: {
          userId: Joi.number().integer().required()
        },
        payload: {
          application: Joi.string().required(),
          roles: Joi.array().items(Joi.string()),
          groups: Joi.array().items(Joi.string())
        }
      }
    }
  }
];
