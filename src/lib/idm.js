const Helpers = require('./helpers');
const DB = require('./connectors/db');
const Notify = require('./connectors/notify');
const uuidv4 = require('uuid/v4');
const { isFinite, parseInt, get } = require('lodash');

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
    const { err, data } = await getUserByUsername(email, application);

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

async function getUserByUsername (userName, application) {
  const query = `
    select *
    from idm.users
    where lower(user_name) = lower($1)
    and application = $2;`;

  return DB.query(query, [userName, application]);
}

async function doUserLogin (userName, password, application) {
  return getUserByUsername(userName, application)
    .then((userResponse) => {
      const user = userResponse.data[0] || null;

      if (user) {
        return Helpers.compareHash(password, user.password)
          .then(() => {
            updateAuthenticatedUser(user);
            return {
              user_id: user.user_id,
              err: null,
              reset_required: user.reset_required,
              reset_guid: user.reset_guid,
              last_login: user.last_login,
              bad_logins: user.bad_logins,
              user_data: user.user_data
            };
          })
          .catch(() => {
            return increaseLockCount(user)
              .then(() => {
                return Promise.reject(new Error('Incorrect hash'));
              });
          });
      } else {
        return Promise.reject(new Error('Incorrect login email'));
      }
    })
    .catch(err => {
      console.error(err);
      return Promise.reject(err);
    });
}

function increaseLockCount (user) {
  const badLogins = parseInt(get(user, 'bad_logins', 0));
  const loginCount = isFinite(badLogins) ? badLogins + 1 : 1;

  if (loginCount === 10) {
    const resetGuid = uuidv4();

    const promises = [
      updateBadLoginsAndResetPassword(user.user_id, loginCount, resetGuid),
      Notify.sendPasswordLockEmail({
        email: user.user_name,
        firstname: get(user, 'user_data.firstname', 'User'),
        resetGuid
      })
    ];

    return Promise.all(promises);
  }

  return updateBadLogins(user.user_id, loginCount);
}

const updateBadLogins = (userID, loginCount) => {
  const query = `
    update idm.users
    set bad_logins = $2,
    date_updated = now()
    where user_id = $1`;

  return DB.query(query, [userID, loginCount]);
};

const updateBadLoginsAndResetPassword = (userID, loginCount, resetGuid) => {
  const query = `
    update idm.users
    set password = 'VOID',
    reset_guid = $3,
    bad_logins = $2,
    date_updated = now()
    where user_id = $1`;

  return DB.query(query, [userID, loginCount, resetGuid]);
};

const updateAuthenticatedUser = user => {
  const query = `
    update idm.users
    set bad_logins = 0,
    last_login = now(),
    date_updated = now()
    where user_id = $1;`;

  return DB.query(query, [user.user_id]);
};

module.exports = {
  loginUser,
  reset
};
