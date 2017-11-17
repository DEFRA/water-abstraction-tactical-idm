function sendPasswordResetEmail(params) {

  return new Promise((resolve, reject) => {


    var NotifyClient = require('notifications-node-client').NotifyClient,
      notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
    var templateId = '78261167-9e03-41a8-9292-cbed017d795a'
    var personalisation = {
      firstname: params.firstname,
      resetguid: params.resetGuid
    }
    var emailAddress = params.email
    notifyClient
      .sendEmail(templateId, emailAddress, personalisation)
      .then((response) => {
        resolve (true)
      })
      .catch((err) => {
        console.log('Error occurred sending notify email')
        console.log(err.message)
        resolve (true)
      });
  });

}

function sendPasswordLockEmail(params) {

  return new Promise((resolve, reject) => {

    console.log(sendPasswordLockEmail)
    console.log(params)
    var NotifyClient = require('notifications-node-client').NotifyClient,
      notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
    var templateId = '985907b6-8930-4985-9d27-17369b07e22a'
    var personalisation = {
      resetguid: params.resetGuid,
      firstname:params.firstname,
    }
    var emailAddress = params.email
    notifyClient
      .sendEmail(templateId, emailAddress, personalisation)
      .then((response) => {
        console.log('notified!')
        resolve (true)
      })
      .catch((err) => {
        console.log('Error occurred sending notify email')
        console.log(err.message)
        reject (err)
      });
  });

}



module.exports = {
  sendPasswordResetEmail: sendPasswordResetEmail,
  sendPasswordLockEmail: sendPasswordLockEmail
};
