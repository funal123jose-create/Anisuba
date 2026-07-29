# AniSuba catalog foundation

## Scope

This block stabilizes the shared catalog and its first real media workflow
before AniList or multi-season management. It is intentionally additive,
preserves demo mode, and keeps the existing `submit_manual_anime` RPC.

## Domain model

- `anime_franchises` remains the shared work/franchise.
- `anime_entries` remains an individual season, movie, OVA, or special.
- `anime_external_ids` attaches provider identifiers to an entry. AniList and
  MyAnimeList identify individual media entries, not an abstract franchise.
- `anime_relations` stores directed relationships between entries.
- `catalog_submissions` records every moderation round for a franchise.
- `catalog_change_requests` lets a user propose a correction without directly
  mutating published catalog data.
- `catalog_draft_preferences` preserves the owner's intended library status,
  starting episode, favorite flag, rating, and note while the shared catalog
  record is still a draft. These values are private and are not catalog data.
- `anime_assets` stores auditable metadata for covers, banners, and future
  promotional images. Physical files live in the `anime-media` Storage bucket.
- Personal state remains in `user_library`, `user_entry_progress`, `ratings`,
  `reviews`, and `favorites`.

## Catalog media

- `anime-media` is public only for CDN delivery. Upload, listing, and deletion
  still require an authenticated RLS policy.
- Upload paths are isolated as
  `user-submissions/<auth.uid()>/<franchise-id>/<unique-file>`.
- The bucket accepts PNG, JPEG, and WEBP with a 5 MB per-file limit.
- The application verifies MIME type, size, and binary signature before
  uploading; client-reported dimensions are optional metadata only.
- `attach_catalog_upload` swaps metadata and the legacy `cover_url` or
  `banner_url` projection in one database transaction.
- `detach_catalog_upload` clears metadata and URL projections atomically; the
  application then removes the physical object through the Storage API.
- New unique paths are used instead of overwriting files, avoiding stale CDN
  content. Failed metadata attachment triggers compensating object cleanup.

## Workflow

The authoritative workflow state remains
`anime_franchises.record_status`:

```text
draft -> in_review -> published
                   -> rejected -> draft -> in_review
published -> archived (administrator only)
```

`catalog_submissions` is the immutable review history. A submission captures a
JSON snapshot so a later catalog edit does not alter what an administrator
actually reviewed.

The manual form lists and reopens the owner's `draft`, `rejected`, and
`in_review` records. Drafts and rejected records remain editable. In-review
records are read-only until an owner withdraws the current submission through
the sanctioned RPC, which restores the record to `draft`.

## Permissions

### Authenticated user

- Reads published catalog records and their own non-published records.
- Creates and edits only a catalog draft owned by the same `auth.uid()`.
- Adds external IDs and relations only to an owned draft.
- Submits an owned draft through the controlled workflow RPC.
- Reads their own moderation submissions.
- Creates and edits their own draft change requests.
- Never publishes, rejects, archives, or edits another user's catalog record.

### Administrator

- Reads and manages all catalog records, entries, genres, external IDs,
  relations, submissions, and change requests.
- Publishes or rejects through a controlled review RPC.
- Administrator status comes from `user_roles`, never user-editable JWT
  metadata.

## Duplicate prevention

### Hard duplicate

`anime_external_ids` has a unique `(provider, external_id)` constraint.
Therefore one AniList or MyAnimeList media ID can resolve to only one
`anime_entry`.

The legacy `source_name/source_external_id` columns are preserved for
compatibility. Their former `UNIQUE NULLS NOT DISTINCT` constraints are
replaced by partial unique indexes that apply only when both values exist.
This fixes the current case where a second `(manual, NULL)` record would be
incorrectly rejected.

### Manual candidate

`normalized_title` is generated for franchises and entries and indexed with
`pg_trgm`. `find_catalog_duplicates` returns visible candidates based on:

- normalized title similarity;
- release year agreement;
- entry type agreement.

This is advisory. A title match never auto-merges a manual record because
remakes and unrelated works can share a title.

Before direct registration or review submission, the application displays
visible candidates scoring at least 0.70 and requires an explicit
"continue anyway" confirmation. The confirmation is request-scoped and does
not disable the database's hard external-ID uniqueness.

## Migration order

1. `extend_catalog_workflow_statuses`
   - Adds `in_review` and `rejected` to the existing catalog status enum.
   - Kept separate because PostgreSQL cannot safely use a newly added enum
     value inside the same transaction that creates it.
2. `catalog_foundation_entities`
   - Adds normalized titles and moderation metadata.
   - Fixes legacy source uniqueness.
   - Creates external IDs, relations, submissions, and change requests.
3. `catalog_workflow_rls`
   - Adds role-aware RLS and explicit Data API grants.
   - Adds controlled submit/withdraw/review RPCs.
   - Adds the duplicate-candidate query.
4. `consolidate_catalog_rls_policies`
   - Combines user and administrator conditions into one policy per action.
   - Preserves permissions while avoiding redundant permissive-policy
     evaluation.
5. `add_catalog_media_storage`
   - Creates `anime_assets`, the public delivery bucket, owner-scoped Storage
     policies, and the transactional attachment RPC.
6. `add_catalog_media_detach`
   - Adds transactional metadata removal and URL cleanup for editable drafts.
7. `protect_manual_catalog_workflow`
   - Adds a workflow trigger so ordinary users cannot mutate catalog content
     after it leaves an editable state.
8. `add_catalog_draft_preferences`
   - Adds private, owner-scoped draft preferences with RLS and explicit grants.
9. `fix_catalog_workflow_lock_admin_check`
   - Corrects the trigger's call to the role helper.
10. `allow_owned_review_withdrawal`
    - Permits only the sanctioned owner withdrawal from `in_review` to `draft`
      while preserving the general workflow lock.
11. `index_catalog_draft_preferences_entry`
    - Adds the covering index required by the draft preference entry foreign
      key.

## Safety and rollback

- No existing table or data is deleted.
- No existing table or column is renamed.
- Existing source columns and RPC signatures remain intact.
- New tables use foreign keys and indexed relationship columns.
- The catalog currently contains zero domain rows, so no catalog record is
  transformed by these migrations.
- Enum values are forward-only but harmless. All other new objects can be
  removed in a later compensating migration if the feature is abandoned.
- Production rollback should be a new forward migration; already deployed
  migrations must not be edited or reset.

## Validation checklist

- Confirm new enum values, tables, constraints, indexes, grants, and policies.
- Confirm RLS is enabled on every new public table.
- Confirm duplicate provider IDs fail with a unique violation.
- Confirm multiple manual records with null external IDs are allowed.
- Confirm normal users cannot approve/reject or edit another user's draft.
- Confirm administrators can review through the controlled RPC.
- Confirm the existing manual RPC still resolves and accepts the same
  parameters.
- Confirm a signed-in user can upload only under their own path.
- Confirm a cover is saved in Storage, represented in `anime_assets`, and
  projected to the franchise and entry URLs.
- Confirm removing a cover deletes both its metadata and physical object.
- Confirm test drafts and objects are removed after end-to-end verification.
- Confirm drafts reopen with catalog fields, images, and private preferences.
- Confirm duplicate candidates block registration/review until explicitly
  acknowledged.
- Confirm review submission locks the form and owner withdrawal restores
  editability.
- Run Supabase security/performance advisors.
- Run application lint, unit tests, typecheck, build, and `git diff --check`.

## Advisor exception

The three workflow transition RPCs are intentionally `SECURITY DEFINER`.
Direct table policies do not allow a user to change moderation state. The RPCs
perform the state transition and audit insert atomically, validate
`auth.uid()` plus ownership or administrator role, use an empty `search_path`,
and revoke anonymous/public execution. Supabase therefore reports its generic
`authenticated_security_definer_function_executable` warning, but the exposed
behavior is intentional and covered by transaction-level authorization tests.
