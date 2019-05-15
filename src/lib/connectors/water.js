const helpers = require('@envage/water-abstraction-helpers');
const config = require('../../../config');

/**
 * Sends a notify message, this is used in the the event of a password lock
 * @param  {String} messageRef      - message ref identifies notify template
 * @param  {[type]} recipient       - email address of recipient
 * @param  {[type]} personalisation - personalisation options for Notify
 * @return {Promise}                 resolves with Notify response
 */
const sendNotifyMessage = async (messageRef, recipient, personalisation = {}) => {
  try {
    const uri = `${config.services.water}/notify/${messageRef}`;
    const options = { body: { recipient, personalisation } };
    const response = await helpers.serviceRequest.post(uri, options);
    return response;
  } catch (err) {
    helpers.logger.error(`Error sending notify messag`, err);
    throw err;
  }
};

module.exports = {
  sendNotifyMessage
};
