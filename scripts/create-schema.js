require('dotenv').config();
const config = require('../config');
const { Pool } = require('pg');

const pool = new Pool(config.pg);

async function run () {
  const { error } = await pool.query('CREATE SCHEMA IF NOT EXISTS idm;');
  console.log(error || 'OK');
  process.exit(error ? 1 : 0);
}

run();
