-- Restore deleted "charging" role
insert into idm.roles
  select
    public.gen_random_uuid(),
    'water_admin',
    'charging',
    'Administer charging',
    now(),
    now();

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

-- Remove the "view_charge_versions" role
delete from idm.group_roles
where role_id in (
  select role_id
  from idm.roles
  where application = 'water_admin'
  and "role" = 'view_charge_versions'
);

delete from idm.roles where application='water_admin' and role='view_charge_versions';
