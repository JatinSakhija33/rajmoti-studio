
create or replace function public.gallery_object_public(objname text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- site-wide CMS assets (hero, covers) are public by design
    objname like 'site/%'
    or exists (
      select 1 from public.images i
      where i.hidden = false
        and (
          i.storage_path = objname
          or objname like (i.id::text || '/%')
          or split_part(objname, '/', 2) = i.id::text
          or split_part(split_part(objname, '/', 2), '.', 1) = i.id::text
        )
    );
$$;

revoke all on function public.gallery_object_public(text) from public;
grant execute on function public.gallery_object_public(text) to anon, authenticated, service_role;

drop policy if exists "gallery public read" on storage.objects;
create policy "gallery public read"
on storage.objects for select
to public
using (
  bucket_id = 'gallery'
  and (
    public.gallery_object_public(name)
    or has_role(auth.uid(), 'admin'::app_role)
  )
);

drop policy if exists "anon manage session favorites" on public.image_favorites;
