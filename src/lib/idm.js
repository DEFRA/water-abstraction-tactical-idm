const Helpers = require('./helpers')
const DB = require('./connectors/db')
const Notify = require('./connectors/notify')
const Slack = require('./slack')


function loginError(request, reply) {
  reply({
    user_id: null,
    err: 'Unknown user name or password'
  }).code(401)
}

function createUser(request, reply) {
  Helpers.createHash(request.payload.password).then((hashedPW) => {
    var query = `insert into idm.users (user_name,password,admin,user_data,reset_guid,reset_required)
    values (lower($1),$2,$3,$4,$5,$6)`

    var queryParams = [request.payload.username, hashedPW, request.payload.admin, request.payload.user_data,Helpers.createGUID(),1]
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
    var query = `update idm.users set password = $1, reset_guid = NULL, bad_logins=0 where lower(user_name) = lower($2)`
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

// /**
//  * Changes password for user with reset guid
//  * @param {Object} request - HAPI HTTP request
//  * @param {Object} request.query - HTTP GET data
//  * @param {String} request.query.resetGuid - the reset GUID issued by email
//  * @param {Object} reply - HAPI HTTP reply
//  */
// async function findUserByResetGuid(request, reply) {
//
// }


/**
 * Changes password for user with reset guid
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - HTTP POST data
 * @param {String} request.payload.resetGuid - the reset GUID issued by email
 * @param {String} request.payload.password - the user's new password
 * @param {Object} reply - HAPI HTTP reply
 */
async function changePasswordWithResetLink(request, reply) {

  /**
   * Update user password
   * @param {String} resetGuid - the reset GUID emailed to the user for password reset
   * @param {String} newPassword - the new password in plain text
   * @return {Promise} resolves when record updated
   */
  const _updatePassword = async function(resetGuid, newPassword) {
    const hash = await Helpers.createHash(newPassword);
    const query = `update idm.users set password = $1, reset_guid = NULL, bad_logins=0, reset_required = NULL where reset_guid = $2`;
    const queryParams = [hash, resetGuid];
    const {error} = await DB.query(query, queryParams);
    if(error) {
      throw error;
    }
    return true;
  }

  try {
    const success = await _updatePassword(request.payload.resetGuid, request.payload.password);
    reply({error : null});
  }
  catch(error) {
    console.error(error);
    reply(error).code(500);
  }
}


/**
 * Method to reset password without sending Notify email
 */
function resetPasswordQuiet(request, reply) {

  /**
   * Finds the user in the DB by email address
   * @param {String} emailAddress
   * @return {Promise} resolves with object containing user data
   */
  async function _findUser(emailAddress) {
    const query = `select * from idm.users where lower(user_name) = lower($1)`;
    const queryParams = [emailAddress];
    const res = await DB.query(query, queryParams);
    if(res.data && res.data.length==1) {
      const {user_id, user_name, reset_guid, last_login} = res.data[0];
      return {user_id, user_name, last_login};
    }
    throw {name : 'UserNotFoundError'};
  }

  /**
   * Sets user reset GUID for user specified by email address
   * @param {String} emailAddress
   * @return {Promise} resolves with string containing new reset GUID
   */
  async function _resetPassword(emailAddress, resetRequired = false) {
    const resetGuid = Helpers.createGUID();
    const query = resetRequired
       ? `update idm.users set reset_guid = $1, reset_required = 1 where lower(user_name) = lower($2)`
       : `update idm.users set reset_guid = $1 where lower(user_name) = lower($2)`;

    const queryParams = [resetGuid, emailAddress];
    const res = await DB.query(query, queryParams);
    if(!res.error) {
      return resetGuid;
    }
    throw {name : 'ResetFailedError'};
  }


  async function _findAndReset(emailAddress, resetRequired) {
    const user = await _findUser(emailAddress);
    const reset_guid = await _resetPassword(emailAddress, resetRequired);
    return {reset_guid, ...user};
  }

  _findAndReset(request.payload.emailAddress, request.payload.resetRequired)
    .then((data) => {
        reply({error : null, data});
    })
    .catch((error) => {
      if(error.name === 'UserNotFoundError') {
        return reply({error, data : null}).code(404);
      }
      return reply({error, data : null}).code(500);
      console.error(error);
    });
}



function resetPassword(request, reply) {
  var resetGuid = Helpers.createGUID()
  //get the user info
  var query = `select * from idm.users where lower(user_name) = lower($1)`
  var queryParams = [request.payload.emailAddress]
  DB.query(query, queryParams)
    .then((res) =>{
      if(res.data.length == 0){
        //console.log('email not found... shhh...')
        // @TODO we don't want to reveal to user if account was found
        // Check with Dave the implications of 404 here
        return reply({err : 'User not found'}).code(404);
      }
      var firstname;
      try {
        firstname = JSON.parse(res.data[0].user_data).firstname
      } catch (e) {
        firstname = '(User)'
      }
      var query = `update idm.users set reset_guid = $1 where lower(user_name) = lower($2)`
      var queryParams = [resetGuid, request.payload.emailAddress]
      DB.query(query, queryParams)
        .then((res) => {
          Notify.sendPasswordResetEmail({
            email: request.payload.emailAddress,
            firstname: firstname || '(User)',
            resetGuid: resetGuid
          }).then((res) => {
            console.log('notify', res);
            return reply(res)
          }).catch((res) => {
            //console.log('could not send email with notify')
            return reply(res)
          })
        })
    }).catch((e) => {
      console.log(e)
      reply(e)
    })

}

function getResetPasswordGuid(request, reply) {
  var query = `select reset_guid from idm.users where lower(user_name) = lower($1)`
  var queryParams = [request.query.emailAddress]

  DB.query(query, queryParams)
    .then((res) => {

      if (res.err) {
        reply(res.err).code(500)
      } else if (!res.data || !res.data[0]) {
        reply({
          err: 'Reset GUID not found for user'
        }).code(404)
      } else {
        reply(res.data[0])
      }
    })
    .catch((e) => {
      console.log(e);
      reply(e);
    })
}

function loginUser(request, reply) {

  doUserLogin (request.payload.user_name,request.payload.password,0).then((result)=>{
    return reply(result)
  }).catch(()=>{
    return loginError(request, reply)
  })

}

function loginAdminUser(request, reply) {
  console.log(`Received admin login user request for ${request.payload.user_name}`)
  doUserLogin (request.payload.user_name,request.payload.password,0).then((result)=>{
    return reply(result)
  }).catch(()=>{
    return loginError(request, reply)
  })
}

function doUserLogin(user_name,password,admin){
  return new Promise((resolve, reject) => {
    if(admin){
      var query = `select * from idm.users where lower(user_name)=lower($1) and admin=1`
    } else {
      var query = `select * from idm.users where lower(user_name)=lower($1)`
    }
    var queryParams = [user_name]
    // console.log(query)
    // console.log(queryParams)
    DB.query(query, queryParams)
      .then((UserRes) => {
        //admin login query result
        if (UserRes.data[0]) {
          Helpers.compareHash(password, UserRes.data[0].password).then(() => {
            resetLockCount(UserRes.data[0]).then(()=>{

            Slack.post('Login from user: *'+user_name.split('@')[0]+'* at environment: '+process.env.NODEENV).then(()=>{


              var query = `select split_part(user_name,'@',1)||'...' as id, last_login from idm.users order by last_login desc`
              DB.query(query).then((res)=>{
                var logins=`* ${process.env.NODEENV} Login History:*`
                for (r in res.data){
                  logins+=`\n ${res.data[r].id} ${res.data[r].last_login}`
                }
                console.log(logins)
                Slack.post(logins).then(()=>{})
                .catch(()=>{})
                .then(()=>{
                  resolve({
                    user_id: UserRes.data[0].user_id,
                    err: null,
                    reset_required: UserRes.data[0].reset_required,
                    reset_guid: UserRes.data[0].reset_guid,
                    last_login_date:UserRes.data[0].last_login_date,
                    bad_logins:UserRes.data[0].bad_logins
                  })
                })

              }).catch((err)=>{
                console.log(err)
                reject()
              })

            })
            })

          }).catch(() => {
//            console.log('rejected for incorect hash')
            increaseLockCount(UserRes.data[0]).then(()=>{
              console.log('Incorrect hash')
              reject('Incorrect hash')
            }).catch(()=>{
              console.log('Incorrect hash & notify email failed')
              reject('Incorrect hash & notify email failed')
            })
          });
        } else {
          console.log('rejected for incorrect email')
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
    var loginCount=user.bad_logins||1
    loginCount++

    if(loginCount ==10){
//      console.log('set login count to '+loginCount)
      var resetGuid=Helpers.createGUID()


      var firstname;
      try {
        firstname = JSON.parse(user.user_data).firstname
      } catch (e) {
        firstname = 'User'
      }
      Notify.sendPasswordLockEmail({
        email: user.user_name,
        firstname: firstname,
        resetGuid: resetGuid
      }).then((res) => {
//        console.log('sent email with notify')
      }).catch((res) => {
//        console.log('could not send email with notify')
      }).then(()=>{
        var queryParams = [user.user_id,loginCount,resetGuid]
        var query = `update idm.users set password='VOID',reset_guid=$3,bad_logins=$2 where user_id=$1`
          DB.query(query, queryParams).then((res)=>{
            resolve()
          }).catch((err)=>{
            console.log(err)
            reject()
          })
      });


      //notify!
    } else if (loginCount > 10){
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
    var query = `update idm.users set bad_logins=0,last_login=clock_timestamp()  where user_id=$1`
    var queryParams = [user.user_id]
    DB.query(query, queryParams).then((res)=>{
      resolve()
    }).catch(()=>{
      reject()
    })
  });
}


function getUser(request, reply) {
  // Find user by numeric ID
  if(typeof(request.params.user_id) === 'number') {
    var query = `select * from idm.users where user_id=$1`
  }
  // Find user by email address
  else {
      var query = `select * from idm.users where user_name=$1`
  }

  var queryParams = [request.params.user_id]
  DB.query(query, queryParams)
    .then((res) => {
      if (res.err) {
        reply(res.err).code(500)
      } else if (!res.data || !res.data[0]) {
        reply({
          err: 'User not found'
        }).code(404)
      } else {
        var user = res.data[0];
        delete user.password
        reply(user)
      }

    })
}





function getUsers(request, reply) {

  let query = `select * from idm.users`;
  const queryParams = [];

  if(request.query.filter) {
    const filter = JSON.parse(request.query.filter);

    if(filter.reset_guid) {
      queryParams.push(filter.reset_guid);
      query += ` WHERE reset_guid=$1`;
    }
  }

  DB.query(query, queryParams)
    .then((res) => {
      if (res.err) {
        reply({error : res.err, data : null}).code(500)
      }
      else {
        reply(res.data);
      }
    })
}

module.exports = {
  createUser: createUser,
  updatePassword: updatePassword,
  resetPassword: resetPassword,
  resetPasswordQuiet,
  getResetPasswordGuid: getResetPasswordGuid,
  changePasswordWithResetLink: changePasswordWithResetLink,
  loginUser: loginUser,
  loginAdminUser: loginAdminUser,
  getUser: getUser,
  getUsers: getUsers,
  loginError: loginError
}
