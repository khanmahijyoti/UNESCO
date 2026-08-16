-- ============================================================
-- Unveil — room system schema (Stage 1: lobby + server-side deal)
--
-- Safe to re-run: drops and recreates its own objects.
--
-- DESIGN RULE THAT GOVERNS EVERYTHING BELOW
-- -----------------------------------------
-- The client is never trusted with a role. Dealing happens inside a
-- SECURITY DEFINER function, and row-level security makes it impossible
-- for one player to read another player's deal before the reveal. A
-- player who opens devtools and queries every table they can reach
-- learns their own card and nothing else.
--
-- Two tables have NO select policy at all — not "restricted", none:
--   cards          card text, reachable only via get_my_card()
--   round_secrets  the burned card, reachable by nobody until reveal
--
-- Policy helpers live in `private` with EXECUTE revoked from anon and
-- authenticated: they are SECURITY DEFINER and bypass RLS by design, so
-- they must not be callable from PostgREST. Every one checks auth.uid()
-- internally, and every policy wraps them in (select ...) so Postgres
-- evaluates them once per query rather than once per row.
-- ============================================================

create schema if not exists private;

-- ---------- reset ----------
drop function if exists public.create_room(text)      cascade;
drop function if exists public.join_room(text, text)  cascade;
drop function if exists public.leave_room(uuid)       cascade;
drop function if exists public.start_round(uuid)      cascade;
drop function if exists public.get_my_card(uuid)      cascade;
drop function if exists public.room_snapshot(text)    cascade;
drop function if exists private.in_room(uuid)         cascade;
drop function if exists private.owns_player(uuid)     cascade;
drop function if exists private.touch_room(uuid)      cascade;
drop table if exists public.votes         cascade;
drop table if exists public.deals         cascade;
drop table if exists public.round_secrets cascade;
drop table if exists public.rounds        cascade;
drop table if exists public.players       cascade;
drop table if exists public.rooms         cascade;
drop table if exists public.cards         cascade;

-- ---------- content ----------
create table public.cards (
  slug          text primary key,
  type          text not null check (type in ('real','fake','audience')),
  headline      text,
  clues         jsonb,
  why_it_works  text
);
comment on table public.cards is
  'Card content. Deliberately has no RLS select policy — reachable only via get_my_card().';

-- ---------- rooms ----------
create table public.rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  host_user    uuid not null,
  phase        text not null default 'lobby'
               check (phase in ('lobby','playing','ended')),
  round_no     int  not null default 0,
  target_score int  not null default 400,
  created_at   timestamptz not null default now(),
  last_active  timestamptz not null default now()
);

create table public.players (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid not null references public.rooms(id) on delete cascade,
  user_id   uuid not null,
  name      text not null check (length(trim(name)) between 1 and 24),
  seat      int,
  score     int  not null default 0,
  is_host   boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);
create index players_room_idx on public.players (room_id);
create index players_user_idx on public.players (user_id);

create table public.rounds (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.rooms(id) on delete cascade,
  round_no     int not null,
  phase        text not null default 'pitch'
               check (phase in ('pitch','vote','reveal')),
  current_seat int not null default 1,
  created_at   timestamptz not null default now(),
  unique (room_id, round_no)
);
create index rounds_room_idx on public.rounds (room_id);

-- The burned card lives here, not on `rounds`, because every player in the
-- room can read `rounds`. Nobody can read this table — including the host.
create table public.round_secrets (
  round_id    uuid primary key references public.rounds(id) on delete cascade,
  burned_slug text not null references public.cards(slug)
);

-- One row per player per round: which card they hold. This is the secret.
create table public.deals (
  id        uuid primary key default gen_random_uuid(),
  round_id  uuid not null references public.rounds(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  slug      text not null references public.cards(slug),
  card_type text not null check (card_type in ('real','fake','audience')),
  seat      int  not null,
  published boolean,
  unique (round_id, player_id),
  unique (round_id, seat)
);
create index deals_round_idx  on public.deals (round_id);
create index deals_player_idx on public.deals (player_id);

create table public.votes (
  id        uuid primary key default gen_random_uuid(),
  deal_id   uuid not null references public.deals(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  vote      text not null check (vote in ('publish','reject')),
  cast_at   timestamptz not null default now(),
  unique (deal_id, player_id)
);
create index votes_player_idx on public.votes (player_id);

-- ============================================================
-- Policy helpers — private schema, SECURITY DEFINER, search_path pinned
-- ============================================================
create function private.in_room(p_room uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.players
    where room_id = p_room and user_id = (select auth.uid())
  );
$$;

create function private.owns_player(p_player uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.players
    where id = p_player and user_id = (select auth.uid())
  );
$$;

create function private.touch_room(p_room uuid)
returns void language sql security definer set search_path = '' as $$
  update public.rooms set last_active = now() where id = p_room;
$$;

-- RLS policy expressions are evaluated with the privileges of the QUERYING
-- role, so `authenticated` must hold EXECUTE on any function a policy calls.
-- Revoking it from authenticated makes every policy fail with
-- "permission denied for function" and nobody can read anything.
--
-- These stay safe because they live in `private`, which PostgREST does not
-- expose, so they are reachable from a policy but not over the API. Each
-- also re-checks auth.uid() internally.
--
-- Note `from public` and not just `from anon`: CREATE FUNCTION grants EXECUTE
-- to PUBLIC by default, and anon inherits it. Revoking from anon alone is a
-- no-op.
revoke execute on function private.in_room(uuid)     from public, anon;
revoke execute on function private.owns_player(uuid) from public, anon;
revoke execute on function private.touch_room(uuid)  from public, anon, authenticated;
grant  execute on function private.in_room(uuid)     to authenticated;
grant  execute on function private.owns_player(uuid) to authenticated;

revoke all   on schema private from anon, authenticated;
grant  usage on schema private to authenticated;

-- ============================================================
-- Row level security
-- ============================================================
alter table public.cards         enable row level security;
alter table public.round_secrets enable row level security;
alter table public.rooms         enable row level security;
alter table public.players       enable row level security;
alter table public.rounds        enable row level security;
alter table public.deals         enable row level security;
alter table public.votes         enable row level security;

-- cards, round_secrets: intentionally no policy at all.

create policy rooms_read on public.rooms
  for select to authenticated using ((select private.in_room(id)));

create policy players_read on public.players
  for select to authenticated using ((select private.in_room(room_id)));

create policy rounds_read on public.rounds
  for select to authenticated using ((select private.in_room(room_id)));

-- The important one. Before the reveal you see only your own deal;
-- once the round is revealed, everyone in the room sees everything.
create policy deals_read on public.deals
  for select to authenticated using (
    (select private.owns_player(player_id))
    or exists (
      select 1 from public.rounds r
      where r.id = deals.round_id
        and r.phase = 'reveal'
        and (select private.in_room(r.room_id))
    )
  );

create policy votes_insert on public.votes
  for insert to authenticated with check ((select private.owns_player(player_id)));

create policy votes_read on public.votes
  for select to authenticated using (
    exists (
      select 1 from public.deals d
      join public.rounds r on r.id = d.round_id
      where d.id = votes.deal_id
        and r.phase = 'reveal'
        and (select private.in_room(r.room_id))
    )
  );

-- ============================================================
-- RPCs. Every state change goes through one of these.
-- ============================================================

create function public.create_room(p_name text)
returns table (room_id uuid, code text, player_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_code text; v_room uuid; v_player uuid; v_try int := 0;
begin
  if v_uid is null then raise exception 'not signed in'; end if;

  -- Unambiguous alphabet: no O/0, I/1, S/5. These codes get read aloud.
  loop
    v_try := v_try + 1;
    select string_agg(substr('ABCDEFGHJKLMNPQRTUVWXYZ23456789',
                             1 + floor(random() * 31)::int, 1), '')
      into v_code
      from generate_series(1, 4);
    exit when not exists (select 1 from public.rooms r where r.code = v_code);
    if v_try > 50 then raise exception 'could not allocate a room code'; end if;
  end loop;

  -- `rooms.id` / `players.id` are qualified because the OUT parameters of
  -- this function (room_id, code, player_id) are in scope as variables.
  insert into public.rooms (code, host_user) values (v_code, v_uid)
  returning rooms.id into v_room;

  insert into public.players (room_id, user_id, name, is_host)
  values (v_room, v_uid, trim(p_name), true)
  returning players.id into v_player;

  return query select v_room, v_code, v_player;
end;
$$;

create function public.join_room(p_code text, p_name text)
returns table (room_id uuid, player_id uuid, rejoined boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_player uuid; v_count int;
begin
  if v_uid is null then raise exception 'not signed in'; end if;

  -- Every column reference below is table-qualified: this function's OUT
  -- parameters (room_id, player_id, rejoined) are in scope as PL/pgSQL
  -- variables and would otherwise shadow players.room_id.
  select * into v_room from public.rooms r where r.code = upper(trim(p_code));
  if not found then raise exception 'no room with that code'; end if;

  -- Rejoining is always allowed, in any phase. A dropped connection must
  -- not cost a seat, and mid-game reconnects are the commonest failure.
  select p.id into v_player from public.players p
   where p.room_id = v_room.id and p.user_id = v_uid;
  if found then
    perform private.touch_room(v_room.id);
    return query select v_room.id, v_player, true;
    return;
  end if;

  if v_room.phase <> 'lobby' then raise exception 'that game has already started'; end if;

  select count(*) into v_count from public.players p where p.room_id = v_room.id;
  if v_count >= 10 then raise exception 'that room is full (10 players)'; end if;

  insert into public.players (room_id, user_id, name)
  values (v_room.id, v_uid, trim(p_name))
  returning id into v_player;

  perform private.touch_room(v_room.id);
  return query select v_room.id, v_player, false;
end;
$$;

create function public.leave_room(p_room uuid)
returns void language sql security definer set search_path = '' as $$
  -- Lobby only. Leaving mid-game would renumber seats under everyone.
  delete from public.players
   where room_id = p_room
     and user_id = (select auth.uid())
     and is_host = false
     and exists (select 1 from public.rooms r where r.id = p_room and r.phase = 'lobby');
$$;

-- The build table from the design doc, enforced server-side:
--   players -> [rogue, audience, real], always summing to players + 1.
-- One extra card is drawn and discarded unseen into round_secrets, which
-- nobody can read. The host does not learn the composition either.
create function public.start_round(p_room uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_room public.rooms%rowtype;
  v_n int; v_rogue int; v_aud int; v_real int;
  v_round uuid; v_pool text[]; v_no int; v_seat int := 1;
  rec record;
begin
  select * into v_room from public.rooms where id = p_room;
  if not found then raise exception 'no such room'; end if;
  if v_room.host_user <> v_uid then raise exception 'only the host can start a round'; end if;

  select count(*) into v_n from public.players where room_id = p_room;
  if v_n < 4  then raise exception 'need at least 4 players (have %)', v_n; end if;
  if v_n > 10 then raise exception 'maximum 10 players'; end if;

  v_rogue := case when v_n <= 6 then 2 when v_n <= 9 then 3 else 4 end;
  v_aud   := case when v_n <= 4 then 0 when v_n <= 7 then 1 else 2 end;
  v_real  := (v_n + 1) - v_rogue - v_aud;

  -- Cards already dealt this game are retired: a story whose truth is
  -- public is worthless the second time round. row_number() over
  -- (order by random()) is the shuffle — a trailing ORDER BY would be
  -- applied after the window function and change nothing.
  with used as (
    select d.slug from public.deals d
      join public.rounds r on r.id = d.round_id
     where r.room_id = p_room
  ), picked as (
    (select slug from public.cards
      where type = 'fake'     and slug not in (select slug from used)
      order by random() limit v_rogue)
    union all
    (select slug from public.cards
      where type = 'audience' and slug not in (select slug from used)
      order by random() limit v_aud)
    union all
    (select slug from public.cards
      where type = 'real'     and slug not in (select slug from used)
      order by random() limit v_real)
  )
  select array_agg(slug order by ord) into v_pool
    from (select slug, row_number() over (order by random()) as ord from picked) s;

  if v_pool is null or array_length(v_pool, 1) <> v_n + 1 then
    raise exception 'not enough unused cards left for % players — start a new game', v_n;
  end if;

  update public.rooms
     set round_no = round_no + 1, phase = 'playing', last_active = now()
   where id = p_room
   returning round_no into v_no;

  insert into public.rounds (room_id, round_no) values (p_room, v_no)
  returning id into v_round;

  insert into public.round_secrets (round_id, burned_slug)
  values (v_round, v_pool[v_n + 1]);

  -- Seats are randomised too, so turn order is not join order. Later
  -- presenters face a better-informed table; fixed order would make that
  -- a permanent positional advantage.
  for rec in select id from public.players where room_id = p_room order by random()
  loop
    insert into public.deals (round_id, player_id, slug, card_type, seat)
    select v_round, rec.id, v_pool[v_seat], c.type, v_seat
      from public.cards c where c.slug = v_pool[v_seat];
    update public.players set seat = v_seat where id = rec.id;
    v_seat := v_seat + 1;
  end loop;

  return v_round;
end;
$$;

-- The only path by which card text reaches a player.
create function public.get_my_card(p_round uuid)
returns table (slug text, card_type text, seat int, headline text, clues jsonb)
language sql stable security definer set search_path = '' as $$
  select d.slug, d.card_type, d.seat, c.headline, c.clues
    from public.deals d
    join public.players p on p.id = d.player_id
    join public.cards   c on c.slug = d.slug
   where d.round_id = p_round
     and p.user_id = (select auth.uid());
$$;

-- Realtime is the primary channel; this is the fallback so a client on a
-- flaky connection can refresh the lobby without a live subscription.
create function public.room_snapshot(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'room', jsonb_build_object(
      'id', r.id, 'code', r.code, 'phase', r.phase,
      'round_no', r.round_no, 'target_score', r.target_score),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'name', p.name, 'seat', p.seat,
               'score', p.score, 'is_host', p.is_host)
             order by p.joined_at)
        from public.players p where p.room_id = r.id), '[]'::jsonb),
    'you_are_host', (r.host_user = (select auth.uid()))
  )
  from public.rooms r
  where r.code = upper(trim(p_code))
    and (select private.in_room(r.id));
$$;

-- ---------- permissions ----------
revoke all on public.cards         from anon, authenticated;
revoke all on public.round_secrets from anon, authenticated;

-- `from public, anon` — not `from anon`. CREATE FUNCTION grants EXECUTE to
-- PUBLIC by default and anon inherits it, so revoking from anon alone leaves
-- every RPC callable without signing in.
revoke execute on function public.create_room(text)     from public, anon;
revoke execute on function public.join_room(text, text) from public, anon;
revoke execute on function public.leave_room(uuid)      from public, anon;
revoke execute on function public.start_round(uuid)     from public, anon;
revoke execute on function public.get_my_card(uuid)     from public, anon;
revoke execute on function public.room_snapshot(text)   from public, anon;

grant execute on function public.create_room(text)     to authenticated;
grant execute on function public.join_room(text, text) to authenticated;
grant execute on function public.leave_room(uuid)      to authenticated;
grant execute on function public.start_round(uuid)     to authenticated;
grant execute on function public.get_my_card(uuid)     to authenticated;
grant execute on function public.room_snapshot(text)   to authenticated;

-- Realtime: the client subscribes to these for live lobby updates.
-- `deals` is deliberately absent — no reason to stream rows a player
-- cannot read anyway.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.rounds;
