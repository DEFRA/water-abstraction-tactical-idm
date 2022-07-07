const Repository = require('@envage/hapi-pg-rest-api/src/repository')
const { createDigitCode } = require('../helpers')

class ChangeEmailRepository extends Repository {
  /**
   * Finds an email change record for todays date by user ID
   * @param  {Number}  userId - the user ID
   * @return {Promise<Object>} - row data if found
   */
  async findOneByUserId (userId) {
    const query = `
      SELECT * FROM idm.email_change WHERE user_id=$1
        AND reference_date=CURRENT_DATE
    `
    const params = [userId]
    const { rows: [row] } = await this.dbQuery(query, params)
    return row
  }

  /**
   * Sets or updates the email address for the email address change record
   * relating to the supplied userId and today's date
   * @param {Number} userId   - the user ID
   * @param {String} newEmail - the user's new email address
   * @return {Promise<Object>} - row data if found
   */
  async create (userId, newEmail) {
    const query = `INSERT INTO idm.email_change
        ( email_change_id, user_id, new_email_address, security_code,
          reference_date, date_created, date_updated, attempts,
          security_code_attempts )
        VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_DATE, NOW(), NOW(), 1, 0) ON CONFLICT (user_id, reference_date) DO UPDATE SET new_email_address=EXCLUDED.new_email_address,
          security_code=EXCLUDED.security_code,
          date_updated=NOW(), attempts=email_change.attempts+1
          WHERE email_change.date_verified IS NULL RETURNING *;`
    const securityCode = createDigitCode()
    const params = [userId, newEmail, securityCode]
    const { rows: [row] } = await this.dbQuery(query, params)
    return row
  }

  async incrementSecurityCodeAttempts (userId) {
    const query = `UPDATE idm.email_change
          SET security_code_attempts=security_code_attempts+1
          WHERE user_id=$1 AND reference_date=CURRENT_DATE;`
    const params = [userId]
    return this.dbQuery(query, params)
  }

  async updateVerified (userId, securityCode) {
    const query = `UPDATE idm.email_change
          SET date_verified=NOW()
          WHERE user_id=$1 AND reference_date=CURRENT_DATE
          AND security_code=$2;`
    const params = [userId, securityCode]
    return this.dbQuery(query, params)
  }
}

module.exports = ChangeEmailRepository
