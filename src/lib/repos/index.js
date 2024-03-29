const UsersRepository = require('./users')
const ChangeEmailRepository = require('./change-email')
const ReauthenticationRepository = require('./reauthentication')
const { pool } = require('../../lib/connectors/db')

const usersRepo = new UsersRepository({
  connection: pool,
  table: 'idm.users',
  primaryKey: 'user_id'
})

const changeEmailRepo = new ChangeEmailRepository({
  connection: pool,
  table: 'idm.email_change_verification',
  primaryKey: 'email_change_verification_id'
})

const reauthRepo = new ReauthenticationRepository({
  connection: pool
})

module.exports = {
  usersRepo,
  changeEmailRepo,
  reauthRepo
}
