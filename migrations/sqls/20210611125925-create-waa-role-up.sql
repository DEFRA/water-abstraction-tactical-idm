/* add new role to the water_admin application for managing links between gauging stations and licences */
insert into idm.roles
  select
    public.gen_random_uuid(),
    'water_admin',
    'manage_gauging_station_licence_links',
    'Manage linkages between gauging stations and licences',
    now(),
    now();


/**
 * Add the new role to groups
 */

insert into idm.group_roles
  select
    public.gen_random_uuid() as group_role_id,
    g.group_id as group_id,
    (select role_id from idm.roles where "role" = 'manage_gauging_station_licence_links') as role_id,
    now() as date_created,
    now() as date_updated
  from idm.groups g
  where g.application = 'water_admin'
  and g.group in ('super', 'psc', 'nps', 'environment_officer');
