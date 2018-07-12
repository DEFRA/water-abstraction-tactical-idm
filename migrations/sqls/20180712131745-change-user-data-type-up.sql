-- delete the view
drop view if exists "idm"."kpi_view";

-- now the type of user_data on the users table can be updated
alter table idm.users
alter column user_data type jsonb using user_data::jsonb;

-- now the view can be recreated
create view "idm"."kpi_view" as  
select
	'registrations_completed' as datapoint,
	usertype as "dimension",
	count(*) as "measure" from (
		select
			case WHEN user_data->>'usertype' is not null then user_data->>'usertype'
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
			case WHEN user_data->>'usertype' is not null then user_data->>'usertype'
				else 'external'
			end as usertype
		from idm.users
		where last_login is null
		and user_id > 113

) x group by datapoint,dimension
