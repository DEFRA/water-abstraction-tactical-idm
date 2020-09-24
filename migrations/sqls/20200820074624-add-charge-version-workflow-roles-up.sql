/* Replace with your SQL commands */
alter table idm.roles 
  alter column role_id set default public.gen_random_uuid();

insert into idm.roles 
  (application, role, description, date_created)
  values 
  ('water_admin', 'charge_version_workflow_editor', 'Create and edit charge information workflow data', NOW()),
  ('water_admin', 'charge_version_workflow_reviewer', 'Approve charge information workflow data', NOW());

alter table idm.group_roles 
  alter column group_role_id set default public.gen_random_uuid();

insert into idm.group_roles
  (group_id, role_id, date_created)
  select g.group_id, r.role_id, now()
    from idm.roles r 
    join idm.groups g on g.application='water_admin' and g.group in ('nps', 'super')
    where role='charge_version_workflow_editor';

insert into idm.group_roles
  (group_id, role_id, date_created)
  select g.group_id, r.role_id, now()
    from idm.roles r 
    join idm.groups g on g.application='water_admin' and g.group in ('billing_and_data', 'super')
    where role='charge_version_workflow_reviewer';