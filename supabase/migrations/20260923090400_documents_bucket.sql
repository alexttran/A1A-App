-- ---------------------------------------------------------------------------
-- Phase 0 — the `documents` storage bucket (ROADMAP Phase 0 infrastructure).
--
-- Private bucket, 50 MB per-object cap (§7.1 mirrors the cap as a CHECK on
-- documents.size_bytes, so the limit is enforced twice: once before the transfer
-- starts and once at rest).
--
-- SCOPE: this migration provisions the bucket and the two policies Phase 3
-- specifies as "authenticated read, authenticated write, no public access".
-- UPDATE and DELETE are deliberately absent — they depend on
-- documents.uploaded_by for the own-upload-vs-any-upload split in §2.2, and that
-- table does not exist until Phase 3. Until then the bucket is append-only for
-- clients, which is the safe direction to be wrong in.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,                                  -- FR-DOC-13: access only via signed, expiring URLs
  52428800,                               -- 50 MB, matching §7.1
  array['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects already has RLS enabled by the Storage extension; only the
-- policies are ours to add. They are scoped by bucket_id so they cannot leak
-- into any bucket added later.

create policy "documents: active users read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.auth_role() is not null
  );

create policy "documents: active users upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and public.auth_role() is not null
  );
