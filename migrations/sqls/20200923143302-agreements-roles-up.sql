/* add new roles to the water_admin application for managing agreements */
insert into idm.roles
  select
    public.gen_random_uuid(),
    'water_admin',
    'manage_agreements',
    'Create and edit licence agreements',
    now(),
    now();

insert into idm.roles
  select
    public.gen_random_uuid(),
    'water_admin',
    'delete_agreements',
    'Delete licence agreements',
    now(),
    now();


/**
 * Add the new roles to groups
 */

insert into idm.group_roles
  select
    public.gen_random_uuid() as group_role_id,
    g.group_id as group_id,
    (select role_id from idm.roles where "role" = 'manage_agreements') as role_id,
    now() as date_created,
    now() as date_updated
  from idm.groups g
  where g.application = 'water_admin'
  and g.group in ('super', 'billing_and_data', 'nps');


insert into idm.group_roles
  select
    public.gen_random_uuid() as group_role_id,
    g.group_id as group_id,
    (select role_id from idm.roles where "role" = 'delete_agreements') as role_id,
    now() as date_created,
    now() as date_updated
  from idm.groups g
  where g.application = 'water_admin'
  and g.group in ('super', 'billing_and_data');
  

