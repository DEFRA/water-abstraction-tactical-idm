insert into idm.group_roles
  (group_id, role_id, date_created)
  select g.group_id, r.role_id, now()
    from idm.roles r 
    join idm.groups g on g.application='water_admin' and g.group in ('billing_and_data')
    where role='charge_version_workflow_editor';