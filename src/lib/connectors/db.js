const config = require('../../../config');
const { Pool } = require('pg');
const pool = new Pool(config.pg);
const logger = require('../logger');

pool.on('acquire', () => {
  const { totalCount, idleCount, waitingCount } = pool;
  if (totalCount === config.pg.max && idleCount === 0 && waitingCount > 0) {
    logger.info(`Pool low on connections::Total:${totalCount},Idle:${idleCount},Waiting:${waitingCount}`);
  }
});

function query (queryString, params) {
  return pool.query(queryString, params)
    .then(res => {
      return {
        data: res.rows,
        error: null
      };
    })
    .catch(err => {
      const {stack, code} = err;
      return {
        error: { stack, code },
        data: null
      };
    });
}

module.exports = {
  query,
  pool
};
