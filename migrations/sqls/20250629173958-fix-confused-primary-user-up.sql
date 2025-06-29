/*
  https://eaflood.atlassian.net/browse/WATER-5124

  Now and again, we are asked by the business to run a [query that generates a list of registered licences and their
  primary users](https://github.com/DEFRA/water-abstraction-team/blob/main/queries/lics_with_primary_users.md).

  We recently amended the query to include additional information. It was at this point that a user of the output
  spotted some duplication. Upon investigation, we found that multiple user accounts were linked to the same entity.

  When a user first registers with the service, it creates a record in both `idm.users` and `crm.entity`. The
  `idm.users` record will have a link to the `crm.entity` via `users.external_id`. When a licence is 'linked' to the
  user, a record is added to `crm.entity_roles` with the 'role' primary_user. This connects the `crm.entity` to
  `crm.document_header` (one of those tables that duplicates license information, which so frustrates us!)

  Voila! The licence has a primary user. We can trace the licence to a 'primary user' role record, to an entity (we
  don't know either), to a user account.

  The duplicates are where there is more than one `idm.users` record with the same `users.external_id`. After reviewing
  the data, there are only three instances where that entity links through to a registered licence.

  | Type     | Username                              | External ID |
  |----------|---------------------------------------|-------------|
  | Internal | billy.whiz@environment-agency.gov.uk  | 12345       |
  | External | billy.whiz@environment-agency.gov.uk  | 12345       |
  | Internal | minnie.minx@environment-agency.gov.uk | 54321       |
  | External | minnie.minx@environment-agency.gov.uk | 54321       |
  | External | artful.dodger@acme.co.uk              | 67890       |
  | External | desperate.dan@acme.co.uk              | 67890       |

  We can ignore Billy Whiz and Minnie Minx in this list because they do not result in duplication in the query. They are
  there due to their registration as ‘Returns agents’ on some licences. The primary user on those licences is
  `area-team@environment-agency.gov.uk`. So, there is no problem.

  The delivery team mentioned that it is possible to transfer licences between user accounts as part of the licence
  transfer process. So, initially, there was a belief that the Acme duplicates were a result of that. However, we now
  believe that is not the case. Excluding Billy and Minnie, you are left with Artful Dodger and Desperate Dan from Acme,
  and these are the only non-EA accounts with a duplicate external ID linked to a registered licence.

  We believe an error or edge case has been hit. The implication for them, though, is that licences where
  `desperate.dan@acme.co.uk` is now the primary user are displayed in the back office, as `artful.dodger@acme.co.uk`
  instead.

  To fix this, we need a migration script that sets `external_id` to null for `artful.dodger@acme.co.uk`.
 */

UPDATE idm.users SET external_id = NULL WHERE user_id = 22;
