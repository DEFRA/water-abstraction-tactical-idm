alter table idm.users
  drop column external_id;

update idm.users
set role = null
where application = 'water_vml';
