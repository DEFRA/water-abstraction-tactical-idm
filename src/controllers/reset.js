const idm = require('../lib/idm');
const moment = require('moment');
const { get, pick } = require('lodash');
const uuid = require('uuid/v4');
const notify = require('../lib/connectors/notify');

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

const shouldUpdateUserResetGuid = user => {
  const { reset_guid: guid, reset_guid_date_created: created } = user;

  if (guid && moment(created).isAfter(moment().subtract(1, 'day'))) {
    return false;
  }
  return true;
};

const getUser = async (email, application) => {
  const result = await idm.getUserByUsername(email, application);

  if (result.err) {
    throw result.err;
  }

  if (result.data.length !== 1) {
    throw new UserNotFoundError(`User not found for email ${email}`);
  }
  return result.data[0];
};

const updateResetGuid = async (user, resetGuid) => {
  const { err } = await idm.updateResetGuid(user.user_id, resetGuid);

  if (err) {
    throw err;
  }
};

const sendPasswordResetEmail = async (user, resetGuid, sender, mode) => {
  const { err } = await notify.sendPasswordResetEmail({
    email: user.user_name,
    firstName: get(user, 'user_data.firstName', '(User)'),
    resetGuid,
    sender
  }, mode);

  if (err) {
    throw new NotifyError(err);
  }
};

const createResetPasswordResponse = (user, resetGuid) => ({
  error: null,
  data: Object.assign({ reset_guid: resetGuid }, pick(user, 'user_name', 'user_id'))
});
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
const resetPassword = async (request, h) => {
  const mode = request.query.mode || 'reset';
  const sender = request.query.sender || null;
  const { email, application } = request.params;

  try {
    const user = await getUser(email, application);
    let resetGuid = user.reset_guid;

    if (shouldUpdateUserResetGuid(user)) {
      request.log('info', `user (${user.user_id}) needs a new reset guid`);
      resetGuid = uuid();
      await updateResetGuid(user, resetGuid);
    }

    await sendPasswordResetEmail(user, resetGuid, sender, mode);

    return createResetPasswordResponse(user, resetGuid);
  } catch (error) {
    if (error.name === 'UserNotFoundError') {
      request.log('info', error);
      return h.response({ data: null, error }).code(404);
    }

    request.log('error', error);
    return h.response({ data: null, error }).code(500);
  }
};

module.exports = {
  resetPassword
};
