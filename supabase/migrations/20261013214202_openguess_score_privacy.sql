-- Restrict raw score rows to owners; publish only a bounded safe projection.
drop policy "Published community scores" on public.og_leaderboard;
revoke all on public.og_leaderboard from anon;
create policy "Own score read" on public.og_leaderboard for select to authenticated using ((select auth.uid()) = user_id);
-- Intentional SECURITY DEFINER: anonymous and signed-in visitors both need the same
-- public projection while raw rows, including owner UUIDs, remain owner-only.
-- No caller input, dynamic SQL, private fields, or write operations are accepted.
create function public.og_public_scores()
returns table (nickname text, wins integer)
language sql stable security definer
set search_path = ''
as $scores$
  select score.nickname, score.wins
  from public.og_leaderboard as score
  order by score.wins desc, score.nickname asc
  limit 20;
$scores$;
revoke all on function public.og_public_scores() from public;
grant execute on function public.og_public_scores() to anon, authenticated;
notify pgrst, 'reload schema';
