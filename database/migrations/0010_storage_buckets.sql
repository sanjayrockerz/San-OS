-- =============================================================================
-- Migration 0010 — Storage buckets & object RLS
-- =============================================================================
-- Creates the five buckets declared in lib/storage/buckets.ts and applies
-- per-user-folder Row Level Security on storage.objects.
--
-- Convention: every object is stored under a top-level folder equal to the
-- owner's auth.uid(), e.g. `avatars/<uid>/photo.png`. RLS keys off the first
-- path segment so a user can only write/read their own folder. Public buckets
-- additionally allow anonymous read (served over the CDN).
--
-- Buckets (matches BUCKET_DEFINITIONS):
--   avatars              public   2MB   images
--   concept-images       public   5MB   images
--   problem-screenshots  private  5MB   images
--   iit-documents        private  25MB  documents
--   attachments          private  25MB  any
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Buckets (idempotent upsert so re-runs stay safe)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152,
   array['image/png','image/jpeg','image/webp','image/gif']),
  ('concept-images', 'concept-images', true, 5242880,
   array['image/png','image/jpeg','image/webp','image/gif']),
  ('problem-screenshots', 'problem-screenshots', false, 5242880,
   array['image/png','image/jpeg','image/webp','image/gif']),
  ('iit-documents', 'iit-documents', false, 26214400,
   array['application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'text/plain','text/markdown']),
  ('attachments', 'attachments', false, 26214400, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Public-read for the public buckets (avatars, concept-images)
-- -----------------------------------------------------------------------------
drop policy if exists "public_buckets_read" on storage.objects;
create policy "public_buckets_read" on storage.objects
  for select to public
  using (bucket_id in ('avatars', 'concept-images'));

-- -----------------------------------------------------------------------------
-- Owner-folder CRUD across every SanOS bucket.
-- The first path segment must equal the caller's uid.
-- -----------------------------------------------------------------------------
drop policy if exists "owner_folder_select" on storage.objects;
create policy "owner_folder_select" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner_folder_insert" on storage.objects;
create policy "owner_folder_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner_folder_update" on storage.objects;
create policy "owner_folder_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "owner_folder_delete" on storage.objects;
create policy "owner_folder_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars','concept-images','problem-screenshots','iit-documents','attachments')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
