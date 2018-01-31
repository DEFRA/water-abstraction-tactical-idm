const Water = require('./water')


/**
 * Sends one of several password reset emails
 * @param {Object} params - parameters for sending message
 * @param {String} params.email - email address to send message to
 * @param {String} params.resetGuid - the reset GUID to uniquely identify the user reset request
 * @param {String} params.firstName - the first name for personalisation of email message
 * @return {Promise}
 * @
 */
function sendPasswordResetEmail(params, mode = 'reset') {
  const {email, resetGuid, firstName} = params;
  const personalisation = {
    firstname : firstName,
    reset_url : `${process.env.base_url}/reset_password_change_password?resetGuid=${resetGuid}`
  };
  const messageRefs = {
    reset : 'password_reset_email',
    new : 'new_user_verification_email',
    existing : 'existing_user_verification_email'
  };
  return Water.sendNotifyMessage(messageRefs[mode], email, personalisation);
}


/*
function sendPasswordResetEmail(params) {

  return new Promise((resolve, reject) => {
    console.log(params)
    var reset_url = `${process.env.base_url}/reset_password_change_password?resetGuid=${params.resetGuid}`
    var personalisation = {
      firstname: params.firstname,
      reset_url: reset_url
    }
    var emailAddress = params.email
    Water.sendNotifyMessage('password_reset_email', emailAddress, personalisation)
    .then((response) => {
        resolve(true)
      })
      .catch((err) => {
        console.log('Error occurred sending notify email')
        console.log(err.message)
        resolve(true)
      });
  });

}
*/



function sendPasswordLockEmail(params) {

  return new Promise((resolve, reject) => {

    console.log(sendPasswordLockEmail)
    console.log(params)
    var NotifyClient = require('notifications-node-client').NotifyClient,
      notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
    var templateId = '985907b6-8930-4985-9d27-17369b07e22a'
    var reset_url = `${process.env.reset_url}${params.resetGuid}`
    var personalisation = {
      reset_url: reset_url,
      firstname: params.firstname,
    }
    var emailAddress = params.email
    Water.sendNotifyMessage('password_locked_email', emailAddress, personalisation)
      .then((response) => {
        console.log('notified!')
        resolve(true)
      })
      .catch((err) => {
        console.log('Error occurred sending notify email')
        console.log(err.message)
        reject(err)
      });
  });

}



module.exports = {
  sendPasswordResetEmail: sendPasswordResetEmail,
  sendPasswordLockEmail: sendPasswordLockEmail
};
