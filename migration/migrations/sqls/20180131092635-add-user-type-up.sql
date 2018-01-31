-- this script sets the json usertype for existing users

update idm.users
set
user_data = user_data::jsonb|| '{"usertype":"internal"}'::jsonb|| '{"usertype":"external"}'::jsonb
where user_data not like '%{first%' and user_data != '{}'
;


update idm.users
set
user_data = user_data::jsonb|| '{"usertype":"internal"}'::jsonb|| '{"usertype":"project"}'::jsonb
where user_data not like '%{first%' and user_data != '{}'
and
(
user_name like '%environment-agency.gov.uk%'
or user_name like '%defra.gsi.gov.uk%'
or user_name like '%james.carmichael%'
or user_name like '%dave.cozens%'
or user_name like '%litmustest.com%'
or user_name like '%lee.murray%'
or user_name like '%mailinator.com%'
or user_name like '%andrewhick%'
or user_name like '%clare.lutwyche%'
or user_name like '%russell.ashley%'
or user_name like '%andy.turner%'
or user_name like '%edward.power%'
or user_name like '%kate.lloyd%'
or user_name like '%ashley.harbison%'
)
;

update
idm.users
set user_data = '{"usertype":"project","firstname":""}'
where user_data like '%{first%' or user_data = '{}'
;
