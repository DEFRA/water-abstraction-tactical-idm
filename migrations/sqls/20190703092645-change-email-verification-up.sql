/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS idm.email_change_verification(
  email_change_verification_id VARCHAR COLLATE pg_catalog.default NOT NULL,
  user_id INT NOT NULL,
  new_email_address VARCHAR,
  authenticated BOOLEAN NOT NULL,
  verification_code VARCHAR COLLATE pg_catalog.default,
  date_created TIMESTAMP WITH TIME ZONE NOT NULL,
  date_verified TIMESTAMP WITH TIME ZONE,
  CONSTRAINT user_id FOREIGN KEY (user_id)
    REFERENCES idm.users (user_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE,
  PRIMARY KEY (email_change_verification_id)
)
