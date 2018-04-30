/*

API operations only - NO UI

*/

const IDM = require('../lib/idm')
const version = '1.0'
const Joi = require('joi')
const {pool} = require('../lib/connectors/db');
const apiConfig = {
  pool,
  version
};

const UsersController = require('../controllers/user')(apiConfig);
const KpiApi = require('../controllers/kpi-reports.js')(apiConfig);

module.exports = [
  { method: 'GET', path: '/status', handler: function(request,reply){return reply('ok').code(200)}, config:{
    auth: false,
    description: 'Status placeholder'
  }},


  ...UsersController.getRoutes(),


  { method: 'PATCH', path: '/idm/' + version + '/reset/{email}', handler: IDM.reset, config: {
    validate : {
      params : {
        email : Joi.string().email().required()
      },
      query : {
        mode : Joi.string().valid('reset', 'new', 'existing', 'sharing'),
        sender : Joi.string().email()
      }
    },
    description : 'Reset user password and send one of a selection of reset emails'
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

  {
      method: '*',
      path: '/', // catch-all path
      handler: function(request,reply){reply().code(404)}
  },
  KpiApi.findManyRoute()
]
