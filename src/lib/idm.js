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

/**
 * Error class for if user not found
 */
class UserNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
  }

}

class NotifyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotifyError';
  }
}

/**
 * Reset password and send email
 * Modes can be:
 * - reset : user initiated reset process
 * - new : new user creating an account for the first time
 * - existing : user trying to create account, but account already exists
 *
 * @param {String} request.params.email - user's email address
 * @param {String} request.query.mode - mode
 */
async function reset(request, reply) {
  const mode = request.query.mode || 'reset';
  const {email} = request.params;
  const resetGuid = Helpers.createGUID();


  // Locate user
  // @TODO hapi-pg-rest-api would be cleaner if hapi-pg-rest-api exposed DB interaction layer
  try {
      const query = `SELECT * FROM idm.users WHERE LOWER(user_name)=LOWER($1)`;
      const {err, data} = await DB.query(query, [email]);
      if(err) {
        throw err;
      }
      if(data.length !== 1) {
        throw new UserNotFoundError();
      }

      // Update user with reset guid
      const query2 = `UPDATE idm.users SET reset_guid=$1 WHERE user_id=$2`;
      const {err : err2} = await DB.query(query2, [resetGuid, data[0].user_id]);
      if(err2) {
        throw err2;
      }

      // Send password reset email
      const userData = JSON.parse(data[0].user_data || '{}');
      const result = await Notify.sendPasswordResetEmail({
        email,
        firstName : userData.firstname || '(User)',
        resetGuid
      }, mode);

      if(result.error) {
        throw new NotifyError(result.error);
      }

      // Success
      return reply({
        error : null,
        data : {
          user_id : data[0].user_id,
          user_name : data[0].user_name,
          reset_guid : resetGuid
        }
      });

  }
  catch(error) {
    if(error.name === 'UserNotFoundError') {
      return reply({data : null, error}).code(404);
    }

    console.log(error);

    reply({
      data : null,
      error
    }).code(500);
  }

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
              var query = `select split_part(user_name,'@',1)||'...' as id, last_login from idm.users order by last_login desc`
              DB.query(query).then((res)=>{
                var logins=`* ${process.env.NODEENV} Login History:*`
                for (r in res.data){
                  logins+=`\n ${res.data[r].id} ${res.data[r].last_login}`
                }
                DB.query('update idm.users set last_login = current_date where user_id=$1', [UserRes.data[0].user_id]).then((res,err)=>{
                })
                .catch(()=>{})
                .then(()=>{
                  resolve({
                    user_id: UserRes.data[0].user_id,
                    err: null,
                    reset_required: UserRes.data[0].reset_required,
                    reset_guid: UserRes.data[0].reset_guid,
                    last_login:UserRes.data[0].last_login,
                    bad_logins:UserRes.data[0].bad_logins,
                    user_data:UserRes.data[0].user_data
                  })
                })

              }).catch((err)=>{
                console.log(err)
                reject()
              })

//            })
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


// function getUser(request, reply) {
//   // Find user by numeric ID
//   if(typeof(request.params.user_id) === 'number') {
//     var query = `select * from idm.users where user_id=$1`
//   }
//   // Find user by email address
//   else {
//       var query = `select * from idm.users where user_name=$1`
//   }
//
//   var queryParams = [request.params.user_id]
//   DB.query(query, queryParams)
//     .then((res) => {
//       if (res.err) {
//         reply(res.err).code(500)
//       } else if (!res.data || !res.data[0]) {
//         reply({
//           err: 'User not found'
//         }).code(404)
//       } else {
//         var user = res.data[0];
//         delete user.password
//         reply(user)
//       }
//
//     })
// }




//
// function getUsers(request, reply) {
//
//   let query = `select * from idm.users`;
//   const queryParams = [];
//
//   if(request.query.filter) {
//     const filter = JSON.parse(request.query.filter);
//
//     if(filter.reset_guid) {
//       queryParams.push(filter.reset_guid);
//       query += ` WHERE reset_guid=$1`;
//     }
//   }
//
//   DB.query(query, queryParams)
//     .then((res) => {
//       if (res.err) {
//         reply({error : res.err, data : null}).code(500)
//       }
//       else {
//         reply(res.data);
//       }
//     })
// }

module.exports = {
  loginUser,
  loginAdminUser,
  reset
}
