class ReauthenticationRepository {
  constructor (config) {
    this.connection = config.connection
  }

  /**
   * Finds the reauth record for this user for today.
   * If there isn't one, one is created for them
   * @param  {Number}  userId - the user_id from idm.users
   * @return {Promise} resolves with idm.reauthentication record
   */
  async findByUserId (userId) {
    const query = `INSERT INTO idm.reauthentication
        (reauthentication_id, user_id, reference_date, date_created, date_updated, attempts)
        VALUES (gen_random_uuid(), $1, CURRENT_DATE, NOW(), NOW(), 0) ON CONFLICT (user_id, reference_date) DO UPDATE SET date_updated=NOW(), attempts=reauthentication.attempts+1 RETURNING *;`
    const params = [userId]
    const { rows: [record] } = await this.connection.query(query, params)
    return record
  }

  /**
   * On successful authentication, the attempt counter for today is reset
   * @param  {Number}  userId - the user_id from idm.users
   */
  resetAttemptCounter (userId) {
    const query = `UPDATE idm.reauthentication
        SET attempts=0, date_updated=NOW()
        WHERE user_id=$1 AND reference_date=CURRENT_DATE;`
    const params = [userId]
    return this.connection.query(query, params)
  }
};

module.exports = ReauthenticationRepository
