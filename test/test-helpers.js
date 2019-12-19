require('dotenv').config();
const { pool } = require('../src/lib/connectors/db');

const createUser = async (username, password, application) => {
  const query = `
    insert into idm.users (user_name, password, application)
    values ($1, $2, $3)
    returning *;`;

  const { rows } = await pool.query(query, [username, password, application]);

  return rows[0];
};

const deleteUser = async userID => {
  const query = 'delete from idm.users where user_id = $1;';
  return pool.query(query, [userID]);
};

const deleteTestUsers = () => {
  // eslint-disable-next-line quotes
  const query = `DELETE FROM idm.users WHERE user_data->>'unitTest'='true'`;
  return pool.query(query);
};

module.exports = {
  createUser,
  deleteUser,
  deleteTestUsers
};
