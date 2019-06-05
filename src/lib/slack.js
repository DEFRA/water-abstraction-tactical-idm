// contains generic functions unrelated to a specific component
const rp = require('request-promise-native').defaults({
  strictSSL: false
});

const { logger } = require('../logger');

function post (message) {
  return new Promise((resolve, reject) => {
    var uri = 'https://hooks.slack.com/services/' + process.env.SLACK_HOOK;
    logger.info(uri);
    var options = {
      method: 'POST',
      url: uri,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      form: {
        payload: '{"channel": "#beta-activity", "username": "Gerald The Water Buffalo", "text": "' + message + '", "icon_emoji": ":water_buffalo:"}'
      }
    };

    rp(options)
      .then(() => resolve('yay'))
      .catch(err => reject(err));
  });
}

module.exports = {
  post
};
