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
        console.log(response)
        resolve (true)
      })
      .catch((err) => {
        console.error(err)
        reject (err)
      });



  });

}




module.exports = {
  sendPasswordResetEmail: sendPasswordResetEmail
};
