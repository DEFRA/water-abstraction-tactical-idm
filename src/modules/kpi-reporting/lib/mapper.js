'use-strict';
const { omit } = require('lodash');

const months = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Sums the total number of registrations in all rows and for those in the current year
 * @param {Array} rows
 * @return {Number}
 */
const mapRegistrations = rows => rows.reduce((acc, row) => {
  const year = (new Date()).getFullYear();
  acc.totals.allTime = acc.totals.allTime + row.internal + row.external;
  acc.totals.ytd = acc.totals.ytd + (row.current_year ? row.internal + row.external : 0);
  if (row.current_year) {
    acc.monthly.push({ ...(omit(row, 'current_year')), month: months[row.month - 1], year });
  }
  return acc;
}, { totals: { allTime: 0, ytd: 0 }, monthly: [] });

exports.mapRegistrations = mapRegistrations;
