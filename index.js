// provides tactical IDM API
require('dotenv').config();

const GoodWinston = require('good-winston');
const Hapi = require('hapi');

const serverPlugins = {
  blipp: require('blipp'),
  hapiAuthJwt2: require('hapi-auth-jwt2'),
  good: require('good')
};

const config = require('./config');
const logger = require('./src/lib/logger');

const goodWinstonStream = new GoodWinston({ winston: logger });
logger.init(config.logger);

const server = new Hapi.Server(config.server);

const validateJWT = (decoded, request, h) => {
  console.log(request.url.path);
  console.log(request.payload);
  console.log('CALL WITH TOKEN');
  console.log(decoded);
  // TODO: JWT tokens to DB...
  // do your checks to see if the person is valid

  const isValid = !!decoded.id;
  const message = isValid ? 'huzah... JWT OK' : 'boo... JWT failed';
  console.log(message);
  return { isValid };
};

const cacheKey = process.env.cacheKey || 'super-secret-cookie-encryption-key';
console.log('Cache key' + cacheKey);

const initGood = async () => {
  await server.register({
    plugin: serverPlugins.good,
    options: {
      ...config.good,
      reporters: {
        winston: [goodWinstonStream]
      }
    }
  });
};

const initBlipp = async () => {
  await server.register({
    plugin: serverPlugins.blipp,
    options: config.blipp
  });
};

const configureJwtStrategy = () => {
  server.auth.strategy('jwt', 'jwt', {
    key: process.env.JWT_SECRET,          // Never Share your secret key
    validate: validateJWT,            // validate function defined above
    verifyOptions: {}, // pick a strong algorithm
    verify: validateJWT
  });

  server.auth.default('jwt');
};

const init = async () => {
  initGood();
  initBlipp();

  await server.register({ plugin: serverPlugins.hapiAuthJwt2 });

  configureJwtStrategy();

  // load routes
  server.route(require('./src/routes/idm'));

  if (!module.parent) {
    await server.start();
    const name = process.env.servicename;
    const uri = server.info.uri;
    console.log(`Service ${name} running at: ${uri}`);
  }
};

process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

init();

module.exports = server;
