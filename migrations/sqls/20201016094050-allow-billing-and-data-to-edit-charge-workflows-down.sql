-- Remove the agreements role from the groups
delete from idm.group_roles
where group_id in (
  select group_id
  from idm.groups
  where groups."group" = 'billing_and_data'
  and groups.application='water_admin'
) and role_id in (
    select role_id from idm.roles where role ='charge_version_workflow_editor'
)