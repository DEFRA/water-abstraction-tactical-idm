require('dotenv').config();
const DB = require('../src/lib/connectors/db');

const createUser = async (username, password, application) => {
  const query = `
    insert into idm.users (user_name, password, application)
    values ($1, $2, $3)
    returning *;`;

  const result = await DB.query(query, [username, password, application]);

  if (result.error) {
    throw result.error;
  }

  return result.data[0];
};

const deleteUser = async userID => {
  const query = 'delete from idm.users where user_id = $1;';
  const result = await DB.query(query, [userID]);
  return result;
};

const deleteTestUsers = () => {
  // eslint-disable-next-line quotes
  const query = `DELETE FROM idm.users WHERE user_data->>'unitTest'='true'`;
  return DB.query(query);
};

module.exports = {
  createUser,
  deleteUser,
  deleteTestUsers
};
