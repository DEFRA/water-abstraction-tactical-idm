/* Replace with your SQL commands */
alter table idm.roles 
  alter column role_id drop default;
  
delete from idm.roles where role in ('charge_version_workflow_editor', 'charge_version_workflow_approver');

alter table idm.group_roles 
  alter column group_role_id drop default;
  
delete from idm.group_roles gr
  using idm.groups g, idm.roles r 
  where gr.group_id = g.group_id 
    and gr.role_id = r.role_id
    and g.application='water_admin' and g.group in ('nps', 'super') 
    and r.application='water_admin' and r.role='charge_version_workflow_editor';

delete from idm.group_roles gr
  using idm.groups g, idm.roles r 
  where gr.group_id = g.group_id 
    and gr.role_id = r.role_id
    and g.application='water_admin' and g.group in ('billing_and_data', 'super') 
    and r.application='water_admin' and r.role='charge_version_workflow_reviewer';

delete from idm.roles 
  where application='water_admin' and 
  role in ('charge_version_workflow_editor', 'charge_version_workflow_reviewer');