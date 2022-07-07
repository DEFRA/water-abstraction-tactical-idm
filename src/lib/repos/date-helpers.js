const moment = require('moment')

const getYesterday = refDate =>
  moment(refDate).subtract(1, 'days').format()

const getNow = refDate =>
  moment(refDate).format()

exports.getYesterday = getYesterday
exports.getNow = getNow
