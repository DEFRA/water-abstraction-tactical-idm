const Helpers = require('./helpers')
const DB = require('./connectors/db')
const Notify = require('./connectors/notify')


function loginError(request,reply){
  console.log('fired login error function!')
  reply({user_id:null,err:'Unknown user name or password'}).code(401)
}


/**
This file acts as a temporary IDM solution until such is in place
As such, it should only be used to create and manage users and their relationships with licences
**/

function createUser (request,reply) {
  /**
  Expects
  payload
    .username (string)
    .password (string)
    .admin  (1|0)
    .user_data (arbitrary object)
  **/
  Helpers.createHash(request.payload.password, (err, hashedPW)=> {
    var query = `insert into idm.users (user_name,password,admin,user_data)
    values ($1,$2,$3,$4)`
    var queryParams = [request.payload.username,hashedPW,request.payload.admin,JSON.stringify(request.payload.user_data)]
    DB.query(query, queryParams)
      .then((res) => {
        //res.err = null if no error
        //res.data
        reply(res)
      })
  });
}

function updatePassword (request, reply) {
  /**
  Expects
  payload
    .username (string)
    .password (string)
  **/
  Helpers.createHash(request.payload.password, (err, hashedPW)=> {
    var query = `update idm.users set password = $1, reset_guid = NULL where user_name = $2`
    var queryParams = [hashedPW, request.payload.username]
    console.log(query)
    console.log(queryParams)
    DB.query(query, queryParams)
      .then((res) => {
        //res.err = null if no error
        //res.data
        reply(res)
      })
  });
}

function changePasswordWithResetLink (request, reply) {
  /**
  Expects
  payload
    .resetGuid (string)
    .password (string)
  **/
    console.log(request.payload)
  Helpers.createHash(request.payload.password, (err, hashedPW)=> {

    var query = `update idm.users set password = $1, reset_guid = NULL, reset_required = NULL where reset_guid = $2`
    var queryParams = [hashedPW, request.payload.resetGuid]
    console.log(query)
    console.log(queryParams)
    DB.query(query, queryParams)
      .then((res) => {
        reply(res)
      })
  });
}

function resetPassword (request, reply) {
  /**
  Expects
  payload
    .emailAddress (string)
  **/
  var resetGuid = Helpers.createGUID()
  console.log('resetGuid: '  + resetGuid)

  //get the user info
  var query = `select * from idm.users where user_name = $1`
  var queryParams = [request.payload.emailAddress]
  console.log(query)
  console.log(queryParams)
  DB.query(query, queryParams)
    .then((res) => {
      var firstname;
/**
console.log((res.data[0].user_data))
console.log(JSON.parse(res.data[0].user_data).name)
**/
      try{
        firstname=JSON.parse(res.data[0].user_data).firstname
      }catch(e){
        firstname='(User)'
      }


  var query = `update idm.users set reset_guid = $1 where user_name = $2`
  var queryParams = [resetGuid, request.payload.emailAddress]
  DB.query(query, queryParams)
    .then((res) => {
      console.log(res)

      Notify.sendPasswordResetEmail(
        {email:request.payload.emailAddress,firstname:firstname,resetGuid:resetGuid}
      ).then((res)=>{
          return reply (res)
        }).catch((res)=>{
        return reply (res)
      })
    })
  }).catch((e)=>{
    console.log(e)
  })

}

function getResetPasswordGuid (request,reply) {
  /**
  Expects
  payload
    .emailAddress (string)
  **/
  var query = `select reset_guid from idm.users where user_name = $1`
  var queryParams = [request.query.emailAddress]
  DB.query(query, queryParams)
    .then((res) => {
      if(res.err) {
        reply(res.err).code(500)
      } else if (!res.data || !res.data[0]){
        reply({err:'Reset GUID not found for user'}).code(500)
      } else {
        reply(res.data[0])
      }
    })
}

function loginUser(request,reply){
    console.log(request.payload)
    var query = `select * from idm.users where user_name=$1`
    var queryParams = [request.payload.user_name]
    console.log(query)
    console.log(queryParams)

    console.log(request.payload)
    DB.query(query, queryParams)
      .then((UserRes) => {
        console.log('UserRes 2')
        console.log(UserRes)
        if(UserRes.data && UserRes.data[0]){
          console.log('got a user')
        Helpers.compareHash(request.payload.password, UserRes.data[0].password,(err,PasswordRes)=>{
          console.log(err)
          console.log(PasswordRes)
          if(PasswordRes){
            reply({user_id:UserRes.data[0].user_id,err:null,reset_required:UserRes.data[0].reset_required,reset_guid:UserRes.data[0].reset_guid})
          } else {
            loginError(request,reply)
          }
        });
      } else {
                  console.log('NOT got a user')
        console.log('here!')
        loginError(request,reply)
      }
    }).catch((UserRes)=>{
      console.log('caught in  loginuser')
      console.log(UserRes)
    })
}

function loginAdminUser(request,reply){
    var query = `select user_id,password from idm.users where user_name=$1 and admin=1`
    var queryParams = [request.payload.user_name]
    console.log(request.payload)
    DB.query(query, queryParams)
      .then((UserRes) => {
        console.log('UserRes 1')
        console.log(UserRes)
        if(UserRes.data[0]){
        Helpers.compareHash(request.payload.password, UserRes.data[0].password,(err,PasswordRes)=>{
          console.log(err)
          console.log(PasswordRes)
          if(PasswordRes){
            reply({user_id:UserRes.data[0].user_id,err:null})
          } else {
        console.log('login error!!')
            loginError(request,reply)
          }
        });
      } else {
        console.log('login error!')
        loginError(request,reply)
      }
      })
}


function loginAdministrator(user_name,password,cb){
    var query = `select user_id,user_name,password from idm.users where user_name=$1 and admin=1`
    var queryParams = [user_name]
    DB.query(query, queryParams)
      .then((UserRes) => {
        console.log(UserRes)
        if(UserRes.data[0]){
          console.log('found candidate user')
          console.log(UserRes.data[0])
        Helpers.compareHash(password, UserRes.data[0].password,(err,PasswordRes)=>{
          console.log(err)
          console.log(PasswordRes)
          if(PasswordRes){
          console.log('found password user')
            cb(null,{user_id:UserRes.data[0].user_id,user_name:UserRes.data[0].user_name})
          } else {
                      console.log('not found password user')
            cb({error:'login error'})
          }
        });
      } else {
                  console.log('found issue with user')
            cb({error:'login error'})
      }
      })
}



function getUser(request,reply){
  var query = `select * from idm.users where user_id=$1`
  var queryParams = [request.params.user_id]
  DB.query(query, queryParams)
    .then((res) => {
      if(res.err){
        reply(res.err).code(500)
      } else if (!res.data || !res.data[0]){
        reply({err:'An error occurred'}).code(500)
      } else {
        var user=res.data[0];
        delete user.password
        console.log('got the user')
      reply(user)
      }

    })
}

function addLicenceToUser(request,reply){
  var query = `insert into idm.user_licence (user_id,licence_id) values ($1,$2)`
  var queryParams = [request.params.user_id,request.payload.licence_id]
  DB.query(query, queryParams)
    .then((res) => {
      reply(res)
    })
}

module.exports = {
  createUser: createUser,
  updatePassword: updatePassword,
  resetPassword: resetPassword,
  getResetPasswordGuid: getResetPasswordGuid,
  changePasswordWithResetLink: changePasswordWithResetLink,
  loginUser: loginUser,
  loginAdminUser:loginAdminUser,
  loginAdministrator: loginAdministrator,
  getUser: getUser,
  addLicenceToUser: addLicenceToUser,
  loginError: loginError
}
