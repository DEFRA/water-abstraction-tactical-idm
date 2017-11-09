const Helpers = require('./helpers')
const DB = require('./connectors/db')
const Notify = require('./connectors/notify')


function loginError(request, reply) {
  reply({
    user_id: null,
    err: 'Unknown user name or password'
  }).code(401)
}

function createUser(request, reply) {
  Helpers.createHash(request.payload.password).then((hashedPW) => {
    var query = `insert into idm.users (user_name,password,admin,user_data,reset_guid,reset_required)
    values ($1,$2,$3,$4,$5,$6)`
    var queryParams = [request.payload.username, hashedPW, request.payload.admin, JSON.stringify(request.payload.user_data),Helpers.createGUID(),1]
    DB.query(query, queryParams)
      .then((res) => {
        //res.err = null if no error
        //res.data
        reply(res)
      })
  }).catch(
    (err) => {

      reply(err)
    }
  );
}

function updatePassword(request, reply) {
  Helpers.createHash(request.payload.password).then((hashedPW) => {
    var query = `update idm.users set password = $1, reset_guid = NULL where user_name = $2`
    var queryParams = [hashedPW, request.payload.username]
    DB.query(query, queryParams)
      .then((res) => {
        reply(res)
      })
  }).catch(
    (err) => {
      reply('Error occurred creating user')
    }
  );
}

function changePasswordWithResetLink(request, reply) {
  Helpers.createHash(request.payload.password).then((hashedPW) => {
    var query = `update idm.users set password = $1, reset_guid = NULL, reset_required = NULL where reset_guid = $2`
    var queryParams = [hashedPW, request.payload.resetGuid]
    DB.query(query, queryParams)
      .then((res) => {
        reply(res)
      })
  }).catch(
    (err) => {
      reply('Error occurred creating user')
    }
  );
}

function resetPassword(request, reply) {
  var resetGuid = Helpers.createGUID()
  //get the user info
  var query = `select * from idm.users where user_name = $1`
  var queryParams = [request.payload.emailAddress]
  DB.query(query, queryParams)
    .then((res) => {
      var firstname;
      try {
        firstname = JSON.parse(res.data[0].user_data).firstname
      } catch (e) {
        firstname = '(User)'
      }
      var query = `update idm.users set reset_guid = $1 where user_name = $2`
      var queryParams = [resetGuid, request.payload.emailAddress]
      DB.query(query, queryParams)
        .then((res) => {
          Notify.sendPasswordResetEmail({
            email: request.payload.emailAddress,
            firstname: firstname,
            resetGuid: resetGuid
          }).then((res) => {
            return reply(res)
          }).catch((res) => {
            console.log('could not send email with notify')
            return reply(res)
          })
        })
    }).catch((e) => {
      console.log(e)
      reply(e)
    })

}

function getResetPasswordGuid(request, reply) {
  var query = `select reset_guid from idm.users where user_name = $1`
  var queryParams = [request.query.emailAddress]
  DB.query(query, queryParams)
    .then((res) => {
      if (res.err) {
        reply(res.err).code(500)
      } else if (!res.data || !res.data[0]) {
        reply({
          err: 'Reset GUID not found for user'
        }).code(500)
      } else {
        reply(res.data[0])
      }
    })
}

function loginUser(request, reply) {


  doUserLogin (request.payload.user_name,request.payload.password,0).then((result)=>{
    console.log(result)
    return reply(result)
  }).catch(()=>{
    return loginError(request, reply)
  })

}

function loginAdminUser(request, reply) {
  console.log(`Received admin login user request for ${request.payload.user_name}`)
  doUserLogin (request.payload.user_name,request.payload.password,0).then((result)=>{
    console.log(result)
    return reply(result)
  }).catch(()=>{
    return loginError(request, reply)
  })
}

function doUserLogin(user_name,password,admin){
  return new Promise((resolve, reject) => {
    if(admin){
      var query = `select * from idm.users where user_name=$1 and admin=1`
    } else {
      var query = `select * from idm.users where user_name=$1`
    }
    var queryParams = [user_name]
    DB.query(query, queryParams)
      .then((UserRes) => {
        //admin login query result
        if (UserRes.data[0]) {
          Helpers.compareHash(password, UserRes.data[0].password).then(() => {
            resetLockCount(UserRes.data[0]).then(()=>{
            resolve({
              user_id: UserRes.data[0].user_id,
              err: null,
              reset_required: UserRes.data[0].reset_required,
              reset_guid: UserRes.data[0].reset_guid,
              last_login_date:UserRes.data[0].last_login_date,
              bad_logins:UserRes.data[0].bad_logins
            })
          });
          }).catch(() => {
            console.log('rejected for incorect hash')
            increaseLockCount(UserRes.data[0]).then(()=>{
              reject('Incorrect hash')
            })
          });
        } else {
            console.log('rejected for incorect email')
          reject('Incorrect login')
        }
      })
      .catch((err)=>{
          console.log(err)
          reject('Database error')
      })
  })

}

function increaseLockCount(user){

  return new Promise((resolve, reject) => {
    console.log(user)
    var loginCount=user.bad_logins||1
    loginCount++

    if(loginCount ==10){
      console.log('set login count to '+loginCount)
      var resetGuid=Helpers.createGUID()
      Notify.sendPasswordLockEmail({
        email: user.user_name,
        resetGuid: resetGuid
      }).then((res) => {
        console.log(res)
        var queryParams = [user.user_id,loginCount,resetGuid]
        var query = `update idm.users set password='VOID',reset_guid=$3,bad_logins=$2 where user_id=$1`
          DB.query(query, queryParams).then((res)=>{
            console.log(res)
            resolve()
          }).catch((err)=>{
            console.log(err)
            reject()
          })
      }).catch((res) => {
        console.log('could not send email with notify')
        return reply(res)
      })


      //notify!
    } else if (loginCount > 10){
      console.log('set login count to '+loginCount)
      var queryParams = [user.user_id,loginCount]
      var query = `update idm.users set bad_logins=$2 where user_id=$1`
        DB.query(query, queryParams).then((res)=>{
          resolve()
        }).catch(()=>{
          reject()
        })
  } else {
    var query = `update idm.users set bad_logins=$2 where user_id=$1`
      var queryParams = [user.user_id,loginCount]
    DB.query(query, queryParams).then((res)=>{
      resolve()
    }).catch(()=>{
      reject()
    })
  }


  });
}

function resetLockCount(user){
  return new Promise((resolve, reject) => {
    console.log(user)
    var query = `update idm.users set bad_logins=0,last_login=now() where user_id=$1`
    var queryParams = [user.user_id]
    DB.query(query, queryParams).then((res)=>{
      resolve()
    }).catch(()=>{
      reject()
    })
  });
}


function getUser(request, reply) {
  var query = `select * from idm.users where user_id=$1`
  var queryParams = [request.params.user_id]
  DB.query(query, queryParams)
    .then((res) => {
      if (res.err) {
        reply(res.err).code(500)
      } else if (!res.data || !res.data[0]) {
        reply({
          err: 'An error occurred'
        }).code(500)
      } else {
        var user = res.data[0];
        delete user.password
        console.log('got the user')
        reply(user)
      }

    })
}





function getUsers(request, reply) {
  var query = `select * from idm.users`
  DB.query(query)
    .then((res) => {
      if (res.err) {
        reply(res.err).code(500)
      } else if (!res.data || !res.data[0]) {
        reply({
          err: 'An error occurred'
        }).code(500)
      } else {
        var user = res.data;
        console.log('got the user')
        reply(user)
      }

    })
}

module.exports = {
  createUser: createUser,
  updatePassword: updatePassword,
  resetPassword: resetPassword,
  getResetPasswordGuid: getResetPasswordGuid,
  changePasswordWithResetLink: changePasswordWithResetLink,
  loginUser: loginUser,
  loginAdminUser: loginAdminUser,
  getUser: getUser,
  getUsers: getUsers,
  loginError: loginError
}
