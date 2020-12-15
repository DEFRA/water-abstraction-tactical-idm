'use strict';
require('dotenv').config();

const testMode = parseInt(process.env.TEST_MODE) === 1;
const isAcceptanceTestTarget = ['local', 'dev', 'development', 'test', 'qa', 'preprod'].includes(process.env.NODE_ENV);

module.exports = {
  version: '1.0',
  logger: {
    level: testMode ? 'info' : 'error',
    airbrakeKey: process.env.ERRBIT_KEY,
    airbrakeHost: process.env.ERRBIT_SERVER,
    airbrakeLevel: 'error'
  },

  good: {
    ops: {
      interval: 10000
    }
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

  pg: {
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === 'local' ? 20 : 7,
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

  isAcceptanceTestTarget
};
