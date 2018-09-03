const Helpers = require('./helpers');
const DB = require('./connectors/db');
const Notify = require('./connectors/notify');
const uuidv4 = require('uuid/v4');

function loginError (request, h) {
  return h.response({
    user_id: null,
    err: 'Unknown user name or password'
  }).code(401);
}

/**
 * Error class for if user not found
 */
class UserNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

class NotifyError extends Error {
  constructor (message) {
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
 * - sharing : a user is being invited by another user to share access
 *
 * @param {String} request.params.email - user's email address
 * @param {String} [request.params.sender] - email address of the sender, sharing only
 * @param {String} request.query.mode - mode
 */
async function reset (request, h) {
  const mode = request.query.mode || 'reset';
  const sender = request.query.sender || null;
  const { application, email } = request.params;
  const resetGuid = uuidv4();

  // Locate user
  // @TODO hapi-pg-rest-api would be cleaner if hapi-pg-rest-api exposed DB interaction layer
  try {
    const query = `
      select * from idm.users
      where lower(user_name) = LOWER($1)
      and application = $2`;

    const { err, data } = await DB.query(query, [email, application]);
    if (err) {
      throw err;
    }
    if (data.length !== 1) {
      throw new UserNotFoundError();
    }

    // Update user with reset guid
    const query2 = `UPDATE idm.users SET reset_guid=$1 WHERE user_id=$2`;
    const { err: err2 } = await DB.query(query2, [resetGuid, data[0].user_id]);
    if (err2) {
      throw err2;
    }

    // Send password reset email
    const userData = data[0].user_data || {};
    const result = await Notify.sendPasswordResetEmail({
      email,
      firstName: userData.firstname || '(User)',
      resetGuid,
      sender
    }, mode);

    if (result.error) {
      throw new NotifyError(result.error);
    }

    // Success
    return {
      error: null,
      data: {
        user_id: data[0].user_id,
        user_name: data[0].user_name,
        reset_guid: resetGuid
      }
    };
  } catch (error) {
    if (error.name === 'UserNotFoundError') {
      return h.response({ data: null, error }).code(404);
    }

    console.log(error);

    return h.response({
      data: null,
      error
    }).code(500);
  }
}

function loginUser (request, h) {
  const { user_name: userName,
    password,
    application
  } = request.payload;

  return doUserLogin(userName, password, application)
    .then(result => result)
    .catch(() => loginError(request, h));
}

function doUserLogin (userName, password, application) {
  return new Promise((resolve, reject) => {
    const query = `select *
      from idm.users
      where lower(user_name) = lower($1)
      and application = $2;`;

    const queryParams = [userName, application];

    DB.query(query, queryParams)
      .then((UserRes) => {
        // admin login query result
        if (UserRes.data[0]) {
          Helpers.compareHash(password, UserRes.data[0].password).then(() => {
            resetLockCount(UserRes.data[0]).then(() => {
              var query = `select split_part(user_name,'@',1)||'...' as id, last_login from idm.users order by last_login desc`;
              DB.query(query).then((res) => {
                DB.query('update idm.users set last_login = current_date where user_id=$1', [UserRes.data[0].user_id]).then((res, err) => {
                })
                .catch(() => {})
                .then(() => {
                  resolve({
                    user_id: UserRes.data[0].user_id,
                    err: null,
                    reset_required: UserRes.data[0].reset_required,
                    reset_guid: UserRes.data[0].reset_guid,
                    last_login: UserRes.data[0].last_login,
                    bad_logins: UserRes.data[0].bad_logins,
                    user_data: UserRes.data[0].user_data
                  });
                });
              }).catch((err) => {
                console.log(err);
                reject();
              });
            });
          }).catch(() => {
            increaseLockCount(UserRes.data[0]).then(() => {
              console.log('Incorrect hash');
              reject('Incorrect hash');
            }).catch(() => {
              console.log('Incorrect hash & notify email failed');
              reject('Incorrect hash & notify email failed');
            });
          });
        } else {
          console.log('rejected for incorrect email');
          reject('Incorrect login');
        }
      })
      .catch((err) => {
        console.log(err);
        reject('Database error');
      });
  });
}

function increaseLockCount (user) {
  return new Promise((resolve, reject) => {
    let loginCount = user.bad_logins || 1;
    loginCount++;

    if (loginCount === 10) {
      const resetGuid = uuidv4();

      var firstname;
      try {
        firstname = user.user_data.firstname;
      } catch (e) {
        console.log(`failed to get username from JSON, settings to 'User'`);
        firstname = 'User';
      }
      Notify.sendPasswordLockEmail({
        email: user.user_name,
        firstname: firstname,
        resetGuid: resetGuid
      }).then((res) => {
//        console.log('sent email with notify')
      }).catch((res) => {
//        console.log('could not send email with notify')
      }).then(() => {
        const queryParams = [user.user_id, loginCount, resetGuid];
        const query = `update idm.users set password='VOID',reset_guid=$3,bad_logins=$2 where user_id=$1`;
        DB.query(query, queryParams)
          .then((res) => {
            resolve();
          })
          .catch((err) => {
            console.log(err);
            reject();
          });
      });
    } else if (loginCount > 10) {
      const queryParams = [user.user_id, loginCount];
      const query = `update idm.users set bad_logins=$2 where user_id=$1`;
      DB.query(query, queryParams).then((res) => {
        resolve();
      }).catch(() => {
        reject();
      });
    } else {
      var query = `update idm.users set bad_logins=$2 where user_id=$1`;
      var queryParams = [user.user_id, loginCount];
      DB.query(query, queryParams)
        .then((res) => {
          resolve();
        }).catch(() => {
          reject();
        });
    }
  });
}

function resetLockCount (user) {
  return new Promise((resolve, reject) => {
    var query = `update idm.users set bad_logins=0,last_login=clock_timestamp()  where user_id=$1`;
    var queryParams = [user.user_id];
    DB.query(query, queryParams)
      .then(res => resolve())
      .catch(() => reject());
  });
}

module.exports = {
  loginUser,
  reset
};
