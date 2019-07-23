const Repository = require('@envage/hapi-pg-rest-api/src/repository');

class UsersRepository extends Repository {
  findById (userId) {
    const user = this.find({ user_id: userId });
    return user.data[0];
  }
  checkEmailAddress (verificationId, newEmail) {
    const query = `SELECT user_name FROM idm.users u
      JOIN (
        SELECT application
        FROM idm.users u
        JOIN idm.change_email_verification v ON v.user_id = u.user_id
        WHERE verification_id=$1
      ) v ON v.application=u.application
      WHERE u.user_name=$2`;

    return this.dbQuery(query, [verificationId, newEmail]);
  }
};

module.exports = UsersRepository;
