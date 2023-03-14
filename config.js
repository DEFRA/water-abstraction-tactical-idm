'use strict'

const environment = process.env.ENVIRONMENT
const isProduction = environment === 'prd'

module.exports = {
  version: '1.0',

  // This config is specifically for hapi-pino which was added to replace the deprecated (and noisy!) hapi/good. At
  // some point all logging would go through this. But for now, it just covers requests & responses
  log: {
    // Credit to https://stackoverflow.com/a/323546/6117745 for how to handle
    // converting the env var to a boolean
    logInTest: (String(process.env.LOG_IN_TEST) === 'true') || false,
    level: process.env.WRLS_LOG_LEVEL || 'warn'
  },

  // This config is used by water-abstraction-helpers and its use of Winston and Airbrake. Any use of `logger.info()`,
  // for example, is built on this config.
  logger: {
    level: process.env.WRLS_LOG_LEVEL || 'warn',
    airbrakeKey: process.env.ERRBIT_KEY,
    airbrakeHost: process.env.ERRBIT_SERVER,
    airbrakeLevel: 'error'
  },

  server: {
    router: {
      stripTrailingSlash: true
    },
    port: 8003
  },

  blipp: {
    showAuth: true
  },

  // Database has 198 available connections
  //
  // Outside of development each process runs on 2 instances on 2 cores.
  // So there will be 4 connection pools per service but just 1 locally
  //
  // Allocations:
  //
  // | ----------------------------------- | ------- | ---------- | --------- | ---------- |
  // | Service                             | Local   | Local      | Non local | Non local  |
  // |                                     | process | connection | process   | connection |
  // |                                     | count   | count      | count     | count      |
  // | ----------------------------------- | ------- | ---------- | --------- | ---------- |
  // | water-abstraction-import            |       1 |         20 |         2 | (20)    10 |
  // | water-abstraction-permit-repository |       1 |         16 |         4 | (16)     4 |
  // | water-abstraction-returns           |       1 |         20 |         4 | (20)     5 |
  // | water-abstraction-service           |       2 | (100)   50 |         5 | (100)   20 |
  // | water-abstraction-tactical-crm      |       1 |         20 |         4 | (20)     5 |
  // | water-abstraction-tactical-idm      |       1 |         20 |         4 | (20)     5 |
  // | ----------------------------------- | ------- | ---------- | --------- | ---------- |
  // | TOTAL                               |       6 |        196 |        23 |        196 |
  // | ----------------------------------- | ------- | ---------- | --------- | ---------- |
  //
  pg: {
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000
  },

  services: {
    water: process.env.WATER_URI || 'http://127.0.0.1:8001/water/1.0'
  },

  application: {
    water_vml: process.env.BASE_URL || 'http://127.0.0.1:8000',
    water_admin: process.env.ADMIN_BASE_URL || 'http://127.0.0.1:8008'
  },

  isProduction
}
