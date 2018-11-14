const Helpers = require('./helpers');
const DB = require('./connectors/db');
const Notify = require('./connectors/notify');
const uuidv4 = require('uuid/v4');
const { isFinite, parseInt, get, pick } = require('lodash');

function loginError (request, h) {
  return h.response({
    user_id: null,
    err: 'Unknown user name or password'
  }).code(401);
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
              ...pick(user, ['user_id', 'reset_required', 'reset_guid', 'last_login', 'bad_logins', 'user_data', 'user_name']),
              err: null
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

const updateResetGuid = (userID, guid) => {
  const query = `
    update idm.users
    set reset_guid = $2, reset_guid_date_created = now()
    where user_id = $1;`;

  return DB.query(query, [userID, guid]);
};

module.exports = {
  loginUser,
  updateResetGuid,
  getUserByUsername
};
