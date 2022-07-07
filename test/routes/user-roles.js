const Hapi = require('@hapi/hapi')

const routes = require('../../src/routes/user-roles')

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const getServer = route => {
  const server = Hapi.server()
  const stubbedRoute = {
    ...route,
    handler: () => ({
      testing: true
    })
  }
  server.route(stubbedRoute)
  return server
}

experiment('routes/user-roles', () => {
  experiment('PUT user/{userId}/roles', () => {
    let request
    let server

    beforeEach(async () => {
      request = {
        method: 'PUT',
        url: '/idm/1.0/user/123/roles',
        payload: {
          application: 'test-application',
          roles: ['RoleA'],
          groups: ['GroupA', 'GroupB']
        }
      }

      server = getServer(routes[0])
    })

    test('calls the controller hanlder for a valid request', async () => {
      const response = await server.inject(request)
      expect(response.result.testing).to.be.true()
    })

    test('returns a 400 for an invalid user id', async () => {
      request.url = '/idm/1.0/user/not-an-integer/roles'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('returns a 400 for an invalid application', async () => {
      request.payload.application = 123
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('returns a 400 for a missing application', async () => {
      delete request.payload.application
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('returns a 400 for an invalid list of roles', async () => {
      request.payload.roles = [1, 2, 3]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('returns a 400 for an invalid list of groups', async () => {
      request.payload.groups = [1, 2, 3]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })
  })
})
