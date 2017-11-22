/*

API operations only - NO UI

*/

const IDM = require('../lib/idm')
const version = '1.0'
const Joi = require('joi')

module.exports = [
  { method: 'GET', path: '/status', handler: function(request,reply){return reply('ok').code(200)}, config:{auth: false,description:'Status placeholder'}},
  { method: 'POST', path: '/idm/' + version + '/user', handler: IDM.createUser , config:{description:'Create a new user in IDM'}},
  { method: 'PUT', path: '/idm/' + version + '/user', handler: IDM.updatePassword , config:{description:'TODO:'}},
  { method: 'POST', path: '/idm/' + version + '/changePassword', handler: IDM.changePasswordWithResetLink, config:{description:'TODO:'} },
  { method: 'POST', path: '/idm/' + version + '/resetPassword', handler: IDM.resetPassword, config:{
    description: 'Generates new password reset GUID for user and sends notification email',
    validate : {
      payload : {
        emailAddress : Joi.string().email().required()
      }
    }
  }},
  { method: 'GET', path: '/idm/' + version + '/resetPassword', handler: IDM.getResetPasswordGuid, config:{
    description:'Get password reset GUID for user with specified email address',
    validate : {
      query : {
        emailAddress : Joi.string().email().required()
      }
    }
  }},

  { method: 'POST', path: '/idm/' + version + '/user/login',   handler: IDM.loginUser, config:{
    description: 'Login for non-admin users, responds with user details',
    validate : {
      payload : {
        user_name : Joi.string().required(),
        password : Joi.string().required()
      }
    }
  }},

  { method: 'POST', path: '/idm/' + version + '/user/loginAdmin',   handler: IDM.loginAdminUser , config:{
    description:'Login for admin users, responds with user details',
    validate : {
      payload : {
        user_name : Joi.string().required(),
        password : Joi.string().required()
      }
    }
  }},

  // Get info on a single user with id {user_id}
  { method: 'GET', path: '/idm/' + version + '/user/{user_id}', handler: IDM.getUser, config:{description:'TODO:'} },
  { method: 'GET', path: '/idm/' + version + '/user', handler: IDM.getUsers, config:{description:'TODO:'} },
  {
      method: '*',
      path: '/', // catch-all path
      handler: function(request,reply){reply().code(404)}
  }
]
