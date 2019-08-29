/* add the new charging role to the water_admin application */
insert into idm.roles
  select
    public.gen_random_uuid(),
    'water_admin',
    'charging',
    'Administer charging',
    now(),
    now();

/*
  Add the new charging role to the super and billing_and_data groups
 */
insert into idm.group_roles
  select
    public.gen_random_uuid() as group_role_id,
    g.group_id as group_id,
    (select role_id from idm.roles where "role" = 'charging') as role_id,
    now() as date_created,
    now() as date_updated
  from idm.groups g
  where g.application = 'water_admin'
  and g.group in ('super', 'billing_and_data');
