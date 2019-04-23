const testMode = parseInt(process.env.TEST_MODE) === 1;

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
    port: process.env.PORT || 8003
  },

  blipp: {
    showAuth: true
  },

  pg: {
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  services: {
    water: process.env.WATER_URI || 'http://127.0.0.1:8001/water/1.0'
  }
};
