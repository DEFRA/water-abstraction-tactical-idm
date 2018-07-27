alter table idm.users
  add column external_id character varying;

drop function if exists idm.updateUserRoles();

create function idm.updateUserRoles() returns void as 
$$

begin	

  if exists (
    select schema_name
    from information_schema.schemata
    where schema_name = 'crm'
  )
  then 
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
  end if;

end;
$$ LANGUAGE plpgsql;

select idm.updateuserroles();

drop function idm.updateUserRoles();

update idm.users
set role = '{ "scopes": ["external"] }'::jsonb
where idm.users.role is null
and idm.users.application = 'water_vml';
