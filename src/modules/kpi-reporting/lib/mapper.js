'use-strict';

/**
 * Maps users regisatration repo by application counting the total registrations of all time
 * and listing the total registrations by month for the current year.
 * @param {Array} list of registrations counted and grouped by month, application and year
 * @return {Array} dataList list of objects that takes the form of the initialValue variable
 */

const mapRegistrations = (dataList) => {
  const initialValue =
    [{
      application: 'water_vml',
      allTime: {
        registrations: 0
      },
      monthly: []
    },
    {
      application: 'water_admin',
      allTime: {
        registrations: 0
      },
      monthly: []
    }];

  return dataList.reduce((acc, row) => (
    [{
      application: 'water_vml',
      allTime: {
        registrations: acc[0].allTime.registrations + (row.application === 'water_vml' ? row.registrations : 0)
      },
      monthly: (row.application === 'water_vml' && row.current_year
        ? [...acc[0].monthly, { month: row.month, year: row.year, registrations: row.registrations }] : [...acc[0].monthly])
    },
    {
      application: 'water_admin',
      allTime: {
        registrations: acc[1].allTime.registrations + (row.application === 'water_admin' ? row.registrations : 0)
      },
      monthly: (row.application === 'water_admin' && row.current_year
        ? [...acc[1].monthly, { month: row.month, year: row.year, registrations: row.registrations }] : [...acc[1].monthly])
    }]
  ), initialValue);
};

exports.mapRegistrations = mapRegistrations;
