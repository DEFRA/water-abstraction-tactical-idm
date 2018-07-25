alter table idm.users
  add column external_id character varying;

update idm.users
set external_id = sub.entity_id,
  date_updated = now()
from (
  select entity_id, entity_nm
  from crm.entity
  where entity_type = 'individual'
) as sub
where idm.users.user_name = sub.entity_nm;

update idm.users
set role = '{ "scopes": ["internal"] }'::jsonb
from (
  select entity_id
  from crm.entity_roles
  where role = 'admin'
) sub
where idm.users.external_id = sub.entity_id
and idm.users.application = 'water_vml';

update idm.users
set role = '{ "scopes": ["external"] }'::jsonb
where idm.users.role is null
and idm.users.application = 'water_vml';
