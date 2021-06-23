-- Remove the "charging" role which appears to be a duplicate of "billing"
delete from idm.group_roles
where role_id in (
  select role_id
  from idm.roles
  where application = 'water_admin'
  and "role" = 'charging'
);

delete from idm.roles where application='water_admin' and role='charging';

-- Create new role for "view_charge_versions" 
insert into idm.roles (application, role, description, date_created)
  values('water_admin', 'view_charge_versions', 'View charge information', now());

insert into idm.group_roles
  select
    public.gen_random_uuid() as group_role_id,
    g.group_id as group_id,
    (select role_id from idm.roles where "role" = 'view_charge_versions' and application='water_admin') as role_id,
    now() as date_created,
    now() as date_updated
  from idm.groups g
  where g.application = 'water_admin'
  and g.group in ('super', 'psc', 'nps', 'billing_and_data');

-- Remove "charge_version_workflow_editor" and "manage_billing_accounts" role from NPS group
delete from idm.group_roles where group_role_id in (
  select group_role_id from idm.group_roles gr
    join idm.roles r on gr.role_id=r.role_id
    join idm.groups g on gr.group_id=g.group_id
    where r.role in ('charge_version_workflow_editor', 'manage_billing_accounts') 
      and r.application='water_admin'
      and g.group='nps'
);
