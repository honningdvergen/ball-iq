-- 1.1 Security hardening — three confirmed holes found in the v1.1 audit
-- (all verified against live prod). None change legitimate client behaviour.
--
-- 1) increment_score had NO auth check, was SECURITY DEFINER with EXECUTE to
--    PUBLIC and no search_path — any caller could POST an arbitrary user_id +
--    delta and mutate ANY user's total_score. Bring it in line with its sibling
--    increment_xp (auth.uid() guard + search_path).
-- 2) The 'avatars' storage policies only checked bucket_id, so any authenticated
--    user could overwrite avatars/{victim}.jpg (keys are flat {uid}.jpg, uploaded
--    x-upsert:true). Scope writes to the owner's own object.
-- 3) friendships UPDATE allowed auth.uid() = requester_id, letting a requester
--    self-accept their own pending request. Only the addressee accepts/declines
--    (client setStatus); the requester cancels via DELETE — so restrict UPDATE to
--    the addressee. (select auth.uid()) also clears the initplan advisor warning.

-- ── 1. increment_score: auth guard + search_path (mirror increment_xp) ──────────
create or replace function public.increment_score(user_id uuid, score_delta integer)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if user_id is distinct from auth.uid() then
    raise exception 'unauthorized';
  end if;
  update public.profiles
    set total_score = total_score + score_delta
    where id = user_id;
end;
$function$;

grant execute on function public.increment_score(uuid, integer) to authenticated;
revoke execute on function public.increment_score(uuid, integer) from public, anon;

-- ── 2. avatars bucket: scope INSERT/UPDATE/DELETE to the owner's {uid}.jpg ───────
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Authenticated users can update avatars" on storage.objects;

create policy "Avatar owner can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');

create policy "Avatar owner can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg')
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');

create policy "Avatar owner can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text || '.jpg');

-- ── 3. friendships: only the addressee may UPDATE (accept/decline) ───────────────
drop policy if exists "Users can update their own received requests" on public.friendships;
create policy "Addressee can update received requests" on public.friendships
  for update to authenticated
  using ((select auth.uid()) = addressee_id)
  with check ((select auth.uid()) = addressee_id);

alter table public.friendships
  add constraint friendships_no_self check (requester_id <> addressee_id) not valid;
