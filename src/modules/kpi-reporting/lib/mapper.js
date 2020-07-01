'use-strict';
const { groupBy, mapValues, omit } = require('lodash');

/**
 * Sums the total number of registrations in all rows
 * @param {Array} rows
 * @return {Number}
 */
const getRegistrationCount = rows => rows.reduce((acc, row) => acc + row.registrations, 0);

/**
 * Maps a group of application rows into groups for all time/current year
 * @param {Array} arr - a list of applications by month
 * @param {String} application - the application name
 * @return {Object} the data in the desired shape
 */
const mapGroup = (arr, application) => {
  const currentYear = arr.filter(row => row.current_year);
  return {
    application,
    allTime: {
      registrations: getRegistrationCount(arr)
    },
    currentYear: {
      registrations: getRegistrationCount(currentYear),
      monthly: currentYear.map(row => { return { ...omit(row, ['current_year', 'application']) }; })
    }
  };
};

/**
 * Maps users regisatration repo by application counting the total registrations of all time
 * and listing the total registrations by month for the current year.
 * @param {Array} list of registrations counted and grouped by month, application and year
 * @return {Array} dataList list of objects that takes the form of the initialValue variable
 */

const mapRegistrations = (dataList) => {
  // Group by application name
  const groups = groupBy(dataList, row => row.application);

  // Map each group
  const mappedGroups = mapValues(groups, mapGroup);

  // Return as array
  return Object.values(mappedGroups);
};

exports.mapRegistrations = mapRegistrations;
