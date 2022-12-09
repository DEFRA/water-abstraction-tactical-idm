'use strict'

require('dotenv').config()

const Blipp = require('blipp')
const Hapi = require('@hapi/hapi')
const HapiAuthJwt2 = require('hapi-auth-jwt2')

const config = require('./config')
const db = require('./src/lib/connectors/db')
const HapiPinoPlugin = require('./src/plugins/hapi-pino.plugin.js')
const { logger } = require('./src/logger')

const server = new Hapi.Server(config.server)

const validateJWT = (decoded, request, h) => {
  logger.info(request.path)
  logger.info(request.payload)
  logger.info('CALL WITH TOKEN')
  logger.info(decoded)
  // TODO: JWT tokens to DB...
  // do your checks to see if the person is valid

  const isValid = !!decoded.id
  const message = isValid ? 'huzah... JWT OK' : 'boo... JWT failed'
  logger.info(message)
  return { isValid }
}

const configureJwtStrategy = () => {
  server.auth.strategy('jwt', 'jwt', {
    key: process.env.JWT_SECRET, // Never Share your secret key
    validate: validateJWT, // validate function defined above
    verifyOptions: {}, // pick a strong algorithm
    verify: validateJWT
  })

  server.auth.default('jwt')
}

const init = async () => {
  await server.register(HapiPinoPlugin())

  await server.register({
    plugin: Blipp,
    options: config.blipp
  })

  // JWT token auth
  await server.register(HapiAuthJwt2)

  configureJwtStrategy()

  // load routes
  server.route(require('./src/routes/idm'))

  if (!module.parent) {
    await server.start()
    const name = process.env.SERVICE_NAME
    const uri = server.info.uri
    server.log('info', `Service ${name} running at: ${uri}`)
  }
}

const processError = message => err => {
  logger.error(message, err.stack)
  process.exit(1)
}

process
  .on('unhandledRejection', processError('unhandledRejection'))
  .on('uncaughtException', processError('uncaughtException'))
  .on('SIGINT', async () => {
    logger.info('Stopping IDM service')

    await server.stop()
    logger.info('1/2: Hapi server stopped')

    await db.pool.end()
    logger.info('2/2: Connection pool closed')

    return process.exit(0)
  })

init()

module.exports = server
