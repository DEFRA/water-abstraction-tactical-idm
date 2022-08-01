const repos = require('../lib/repos')
const Boom = require('@hapi/boom')
const usersRepo = repos.usersRepo
const { omit } = require('lodash')

const putUserRoles = async (request) => {
  const { userId } = request.params
  const { application, roles, groups } = request.payload

  const user = await usersRepo.findById(userId)

  if (!user) {
    return Boom.notFound(`User with id ${userId} does not exist`)
  }

  // clean out the old mappings and replace with the new set
  await usersRepo.deleteRoles(userId)
  await Promise.all([
    usersRepo.createRoles(userId, application, roles),
    usersRepo.createGroups(userId, application, groups)
  ])

  // include the updated user in the response
  const updatedUser = await usersRepo.findUserWithRoles(userId)
  return { error: null, data: omit(updatedUser, 'password') }
}

exports.putUserRoles = putUserRoles
