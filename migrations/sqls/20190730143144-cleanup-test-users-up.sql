/* Replace with your SQL commands */
DELETE FROM idm.users WHERE user_name LIKE 'test%@example.com'
AND user_data->>'usertype'='external'
AND (
  user_data->>'firstname'='Dave'
  OR
  user_data->>'firstname'='User'
);
