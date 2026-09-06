-- v1_9_room_lookup — does this invite code point at a joinable room?
-- Callable signed-out (anon): a typed or linked code used to be persisted and
-- promised ("we'll drop you straight into the room") without ever being
-- checked; a typo only failed after the sign-up / guest step, and a stale code
-- re-opened the join modal on every boot. Returns only what the join gate needs.
create or replace function public.room_lookup(p_code text)
returns jsonb
language sql stable security definer set search_path to 'public'
as $function$
  select coalesce(
    (select jsonb_build_object(
        'found', true,
        'state', r.state,
        'players', (select count(*) from public.room_players p where p.room_id = r.id),
        'capacity', r.capacity)
       from public.game_rooms r
      where r.code = upper(trim(p_code))
      limit 1),
    jsonb_build_object('found', false));
$function$;
revoke all on function public.room_lookup(text) from public;
grant execute on function public.room_lookup(text) to anon, authenticated;
