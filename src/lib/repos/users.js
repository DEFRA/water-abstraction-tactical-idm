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
    const query = `
      select g.group
      from idm.groups g
        join idm.user_groups ug on ug.group_id = g.group_id
      where ug.user_id = $1;
    `;

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
      select r.role
      from idm.user_groups ug
        join idm.group_roles gr on ug.group_id = gr.group_id
        join idm.roles r on gr.role_id = r.role_id
      where ug.user_id = $1

      union

      select r.role
      from idm.user_roles ur
        join idm.roles r on ur.role_id = r.role_id
      where ur.user_id = $1;
    `;
    const { rows } = await this.dbQuery(query, [userId]);
    return rows.map(mapRole);
  }

  /**
   * Checks whether the new email address already exists in the
   * users table for the application related to the supplied user ID
   * @param  {Number} userId         - the user ID
   * @param  {String} newEmail       - the desired new email address
   * @return {Promise<Object>}       - returns user if found
   */
  async findInSameApplication (userId, newEmail) {
    const email = newEmail.trim().toLowerCase();

    const query = `SELECT * FROM idm.users u
      JOIN (
          SELECT application
          FROM idm.users u
          WHERE u.user_id=$1
      ) u2 ON u.application=u2.application
      WHERE u.user_name=$2`;

    const params = [userId, email];

    const { rows: [user] } = await this.dbQuery(query, params);
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

  /** Deletes all role and groups associations for the given user id
   *
   * @param {Number} userId The id of the user whose roles and groups are to be deleted
   */
  deleteRoles (userId) {
    const rolesQuery = 'delete from idm.user_roles where user_id = $1';
    const groupsQuery = 'delete from idm.user_groups where user_id = $1';

    return Promise.all([
      this.dbQuery(rolesQuery, [userId]),
      this.dbQuery(groupsQuery, [userId])
    ]);
  }

  /**
   * Assigns roles to a user by creating records in the
   * idm.user_roles type by joining the GUID ids from the idm.roles
   * tables.
   *
   * @param {Number} userId The user to assign the roles to
   * @param {String} application The application the roles are associcated with
   * @param {Array} roles The array of role names to assign to the user
   */
  async createRoles (userId, application, roles) {
    const query = `
      insert into idm.user_roles(user_role_id, user_id, role_id)
      select gen_random_uuid(), $1, r.role_id
      from idm.roles r
      where r.application = $2
      and r.role = any ($3);`;

    return this.dbQuery(query, [userId, application, roles]);
  }

  /**
   * Assigns groups to a user by creating records in the
   * idm.user_groups type by joining the GUID ids from the idm.groups
   * tables.
   *
   * @param {Number} userId The user to assign the groups to
   * @param {String} application The application the groups are associcated with
   * @param {Array} groups The array of group names to assign to the user
   */
  async createGroups (userId, application, groups) {
    const query = `
      insert into idm.user_groups(user_group_id, user_id, group_id)
      select gen_random_uuid(), $1, g.group_id
      from idm.groups g
      where g.application = $2
      and g.group = any ($3);`;

    return this.dbQuery(query, [userId, application, groups]);
  }

  async findUserWithRoles (userId) {
    const [user, roles, groups] = await Promise.all([
      this.findById(userId),
      this.findRoles(userId),
      this.findGroups(userId)
    ]);

    if (user) {
      user.roles = roles;
      user.groups = groups;
    }

    return user;
  }

  /**
   * Finds the user by email address in the given application
   * @param  {String}  userName    - email addresss
   * @param  {String}  application - application name
   * @return {Promise<Object>}       resolves with the user if found
   */
  async findByUsername (userName, application) {
    const query = `
      select *
      from idm.users
      where lower(user_name) = lower($1)
      and application = $2;`;
    const params = [userName, application];
    const { rows: [user] } = await this.dbQuery(query, params);
    return user;
  }

  /**
   * Increments the lock count for the specified user
   * @param {Number} - userId
   * @return {Promise<Object>} resolves with the user if found
   */
  async incrementLockCount (userId) {
    const query = `
      UPDATE idm.users
        SET bad_logins = COALESCE(bad_logins, 0) + 1, date_updated = NOW()
        WHERE user_id=$1
        RETURNING *
    `;
    const params = [userId];
    const { rows: [user] } = await this.dbQuery(query, params);
    return user;
  }

  /**
   * Voids the current users password and sets the reset GUID to the one
   * supplied
   * @param  {Number} userId    - the user ID
   * @param  {String} resetGuid - a new reset GUID
   * @return {Promise}            resolves when current password is voided
   */
  voidCurrentPassword (userId, resetGuid) {
    const query = `
      UPDATE idm.users
        SET password = 'VOID', reset_guid = $2, date_updated = NOW()
        WHERE user_id = $1
    `;
    const params = [userId, resetGuid];
    return this.dbQuery(query, params);
  }

  /**
   * Sets the user's reset GUID
   * @param  {Number} userId    - the user ID
   * @param  {String} resetGuid - a new reset GUID
   * @return {Promise}            resolves when reset GUID is updated
   */
  updateResetGuid (userId, resetGuid) {
    return this.update({ user_id: userId }, { reset_guid: resetGuid });
  }

  /**
   * WHen a user successfully authenticates, update their last login time
   * and reset their lock count
   * @param  {Number} userId - the user ID
   * @return {Promise<Object>} resolves with updated user record
   */
  async updateAuthenticatedUser (userId) {
    const query = `
      update idm.users
      set bad_logins = 0,
      last_login = now(),
      date_updated = now()
      where user_id = $1
      returning *;`;
    const params = [userId];
    const { rows: [user] } = await this.dbQuery(query, params);
    return user;
  };
};

module.exports = UsersRepository;
