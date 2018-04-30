CREATE VIEW "idm"."kpi_view" AS  
select
	'registrations_completed' as datapoint,
	usertype as "dimension",
	count(*) as "measure" from (
		select
			case WHEN to_jsonb(cast(user_data AS json))->>'usertype' is not null then to_jsonb(cast(user_data AS json))->>'usertype'
				else 'external'
			end as usertype
		from idm.users
		where last_login is not null
		and user_id > 113

) x 	group by datapoint,dimension


union

--    How many users have started registration but not completed it?
select
	'registrations_not_completed'  as datapoint,
	usertype as "dimension",
	count(*) as "measure" from (
		select
			case WHEN to_jsonb(cast(user_data AS json))->>'usertype' is not null then to_jsonb(cast(user_data AS json))->>'usertype'
				else 'external'
			end as usertype
		from idm.users
		where last_login is null
		and user_id > 113

) x 	group by datapoint,dimension
