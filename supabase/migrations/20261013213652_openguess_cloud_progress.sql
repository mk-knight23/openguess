-- Private opt-in backups and deliberately public, self-reported community scores.
-- Auth email remains in Supabase Auth and is never joined into these tables.
create table public.og_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null check (jsonb_typeof(progress) = 'object' and progress->>'schema' = 'openguess.progress/v2' and octet_length(progress::text) <= 2000000),
  updated_at timestamptz not null default now()
);
alter table public.og_progress enable row level security;
revoke all on public.og_progress from anon, authenticated;
grant select, insert, update, delete on public.og_progress to authenticated;
create policy "Own backup read" on public.og_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own backup insert" on public.og_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own backup update" on public.og_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own backup delete" on public.og_progress for delete to authenticated using ((select auth.uid()) = user_id);

create table public.og_leaderboard (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 40 and nickname !~ '[[:cntrl:]]'),
  wins integer not null check (wins between 0 and 1000000000)
);
alter table public.og_leaderboard enable row level security;
revoke all on public.og_leaderboard from anon, authenticated;
-- Signed-out readers can retrieve only the published display fields, never owner IDs.
grant select (nickname, wins) on public.og_leaderboard to anon;
grant select, insert, update, delete on public.og_leaderboard to authenticated;
create policy "Published community scores" on public.og_leaderboard for select to anon, authenticated using (true);
create policy "Own score insert" on public.og_leaderboard for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own score update" on public.og_leaderboard for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own score delete" on public.og_leaderboard for delete to authenticated using ((select auth.uid()) = user_id);
create index og_leaderboard_wins_idx on public.og_leaderboard (wins desc);
notify pgrst, 'reload schema';
