-- Run this once in Supabase Dashboard > SQL Editor for the Study Hall project.
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  favorites jsonb not null default '[]'::jsonb,
  recent_games jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_saves enable row level security;
grant select, insert, update on public.player_saves to authenticated;

drop policy if exists "Players can read their own save" on public.player_saves;
create policy "Players can read their own save"
  on public.player_saves for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Players can create their own save" on public.player_saves;
create policy "Players can create their own save"
  on public.player_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own save" on public.player_saves;
create policy "Players can update their own save"
  on public.player_saves for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
