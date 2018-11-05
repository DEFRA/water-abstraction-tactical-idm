const Helpers = require('../helpers');
const logger = require('../logger');

function sendNotifyMessage (messageRef, recipient, personalisation) {
  return new Promise((resolve, reject) => {
    const uri = `${process.env.WATER_URI}/notify/${messageRef}?token=${process.env.JWT_TOKEN}`;
    const requestBody = {
      recipient: recipient,
      personalisation: personalisation
    };

    Helpers.makeURIRequestWithBody(uri, 'post', requestBody)
      .then((response) => {
        const data = response.body;
        resolve(data);
      }).catch((response) => {
        logger.error(response);
        resolve(response);
      });
  });
}

module.exports = {
  sendNotifyMessage
};
