-- ============================================================================
-- Sprint #84 AAA2 — Username profanity filter (SQL backstop)
-- ============================================================================
--
-- Adds a BEFORE INSERT OR UPDATE OF username trigger on public.profiles that
-- rejects usernames matching a curated EN/DE/ES/FR/IT/PT slur list. Client
-- filter at src/lib/profanity.js gives a fast inline error; this trigger is
-- the bypass-proof gate for anyone hitting the Supabase API directly.
--
-- KEEP IN SYNC: the TERMS + WHITELIST arrays below MUST match src/lib/
-- profanity.js. Sprint #84 AAA2 added both files in the same commit. Future
-- edits to one must mirror to the other or the client/server gate will
-- drift (per the QUESTION_DURATION_MS pattern in memory).
--
-- Reverse DDL (if rollback needed):
--   drop trigger if exists profiles_profanity_check on public.profiles;
--   drop function if exists public.profiles_check_profanity();
--   drop function if exists public.is_profane_username(text);
-- ============================================================================

create or replace function public.is_profane_username(p_name text)
returns boolean
language plpgsql
immutable
as $$
declare
  n text;
  w text;
  t text;
  terms text[] := array[
    -- English — hard four
    'fuck','shit','cunt','bitch',
    -- English — racial / ethnic / homophobic / transphobic
    'nigg','fag','faggot','tranny','kike','spic','chink','gook','wetback',
    -- English — ableist / sexual violence
    'retard','rape','pedo','molest',
    -- German — slurs (excluding colloquial 'scheisse')
    'neger','judensau','fotze',
    -- Spanish — slurs (excluding colloquial 'mierda')
    'maricon','puto','pendejo',
    -- French — slurs (excluding colloquial 'merde' / 'con')
    'pute','salope','pede','encule',
    -- Italian — slurs (excluding colloquial 'cazzo')
    'frocio','troia','stronzo',
    -- Portuguese — slurs (excluding colloquial 'porra' / 'caralho')
    'viado','puta','bicha'
  ];
  whitelist text[] := array[
    'scunthorpe',   -- contains 'cunt'
    'penistone',
    'arsenal',      -- contains 'arse'
    'arshavin',
    'mexes',
    'esposito',
    'shittu'
  ];
begin
  if p_name is null or btrim(p_name) = '' then
    return false;
  end if;
  -- Normalize: lowercase, leet→letter, strip non-letters
  n := lower(p_name);
  -- translate(): position-aligned char map.
  --   source pos: 1 2 3 4 5 6 7 8 9
  --   source chr: @ 4 3 1 0 ! $ 5 7
  --   target chr: a a e i o i s s t
  n := translate(n, '@4310!$57', 'aaeioisst');
  n := regexp_replace(n, '[^a-zà-ÿ]', '', 'g');
  -- Mask whitelist first so legit football names whose substrings overlap
  -- a slur (Scunthorpe / Arsenal) don't trigger false positives.
  foreach w in array whitelist loop
    n := replace(n, w, '_');
  end loop;
  -- Substring-match against terms in the remaining text.
  foreach t in array terms loop
    if position(t in n) > 0 then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

revoke execute on function public.is_profane_username(text) from public;
grant execute on function public.is_profane_username(text) to authenticated, anon;

create or replace function public.profiles_check_profanity()
returns trigger
language plpgsql
as $$
begin
  if new.username is not null and public.is_profane_username(new.username) then
    raise exception 'Username not allowed'
      using errcode = 'check_violation',
            hint = 'Choose a different username.';
  end if;
  return new;
end;
$$;

-- Trigger functions are not granted to roles directly; PostgreSQL invokes
-- them as part of the table operation. No GRANT/REVOKE needed here.

drop trigger if exists profiles_profanity_check on public.profiles;
create trigger profiles_profanity_check
  before insert or update of username on public.profiles
  for each row execute function public.profiles_check_profanity();

-- ============================================================================
-- Verification (run AFTER applying):
--
--   select public.is_profane_username('alex');           -- false
--   select public.is_profane_username('Scunthorpe1');    -- false (whitelist)
--   select public.is_profane_username('Arsenal99');      -- false (whitelist)
--   select public.is_profane_username('f.u.c.k.s');      -- true  (strip non-letters)
--   select public.is_profane_username('Sh1tHead');       -- true  (leet)
--   select public.is_profane_username('ScunthorpeFag');  -- true  (whitelist masked, fag remains)
--
-- Existing profane usernames in profiles are NOT rewritten by this trigger;
-- it only gates future INSERT / UPDATE. Cleanup of existing rows (if any)
-- is a separate operation — surface as a follow-up if needed.
-- ============================================================================
