const Repository = require('@envage/hapi-pg-rest-api/src/repository');

const { getNow } = require('./date-helpers');

const mapRole = row => row.role;
const mapGroup = row => row.group;

/**
 * Repository for idm.users table
 * @extends Repository
 */
class UsersRepository extends Repository {
  /**
   * Finds a user by ID
   * @param  {Number}  userId
   * @return {Promise<Object>}
   */
  async findById (userId) {
    const { rows: [user] } = await this.find({ user_id: userId });
    return user;
  }

  async findGroups (userId) {
    const query = `SELECT g.group FROM idm.users u
      JOIN idm.user_groups ug ON u.user_id=ug.user_id
      JOIN idm.groups g ON ug.group_id=g.group_id
      WHERE u.user_id=$1`;
    const { rows } = await this.dbQuery(query, [userId]);
    return rows.map(mapGroup);
  }

  /**
   * Returns an array of roles for the specified user ID.
   * This combines the roles explicitly set for the user in the user_roles
   * table with the ones they get as a result of their group
   * @param  {Number}  userId
   * @return {Promise<Array>}
   */
  async findRoles (userId) {
    const query = `
      SELECT r.role FROM idm.users u
        JOIN idm.user_groups ug ON u.user_id=ug.user_id
        JOIN idm.group_roles gr ON ug.group_id=gr.group_id
        JOIN idm.roles r ON gr.role_id = r.role_id
        WHERE u.user_id=$1
      UNION SELECT r.role FROM idm.users u
        JOIN idm.user_roles ur ON u.user_id=ur.user_id
        JOIN idm.roles r ON ur.role_id=r.role_id
        WHERE u.user_id=$1`;
    const { rows } = await this.dbQuery(query, [userId]);
    return rows.map(mapRole);
  }

  /**
   * Checks whether the new email address already exists in the
   * users table for the application related to the supplied verification ID
   * @param  {String} verificationId - GUID from email_change_verification table
   * @param  {String} newEmail       - the desired new email address
   * @return {<Promise>}             - returns user if found
   */
  async findExistingByVerificationId (verificationId, newEmail) {
    const email = newEmail.trim().toLowerCase();

    const query = `SELECT user_name FROM idm.users u
      JOIN (
        SELECT application
        FROM idm.users u
        JOIN idm.email_change_verification v ON v.user_id = u.user_id
        WHERE email_change_verification_id=$1
      ) v ON v.application=u.application
      WHERE u.user_name=$2`;

    const { rows: [user] } = await this.dbQuery(query, [verificationId, email]);
    return user;
  }

  /**
   * Sets the email address of the user with the specified ID to a new value
   * @param  {Number} userId   - user ID
   * @param  {String} newEmail - the new email address
   * @return {Promise<Object>} - user record
   */
  async updateEmailAddress (userId, newEmail, refDate) {
    const filter = { user_id: userId };
    const data = {
      user_name: newEmail.toLowerCase().trim(),
      date_updated: getNow(refDate)
    };
    const { rows: [user] } = await this.update(filter, data);
    return user;
  }
};

module.exports = UsersRepository;
