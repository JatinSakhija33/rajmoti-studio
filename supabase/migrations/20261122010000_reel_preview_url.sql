alter table public.reels
  add column if not exists preview_url text;

comment on column public.reels.preview_url is
  'Optional short silent web clip for hover previews on published reels.';
