-- Ver.10 expedition summons. Apply only after isolated DB tests and release review.
begin;
-- Retain all v1 denominations; add one new v2 weekly hidden-boss receipt.
alter table public.pq_expedition_receipts drop constraint pq_expedition_receipt_format;
alter table public.pq_expedition_receipts add constraint pq_expedition_receipt_format check (length(receipt_id)<=64 and (receipt_id ~ '^v1:[0-9]{4}-[0-9]{2}-[0-9]{2}:((market|trail|citadel):(step1|step2|step3|chest|normal|boss)|all:weekly)create schema if not exists pq_expedition_private;
revoke all on schema pq_expedition_private from public,anon,authenticated;
grant usage on schema pq_expedition_private to authenticated;
create table public.pq_expedition_draws (
 user_id uuid not null references auth.users(id) on delete cascade,
 draw_no integer not null check(draw_no between 1 and 50000),
 request_id uuid not null,
 item_id text not null check(item_id in ('n1','n2','r1','r2','sr1','sr2','ssr1','ssr2','ur1','ur2')),
 created_at timestamptz not null default now(),
 primary key(user_id,draw_no), unique(user_id,request_id)
);
alter table public.pq_expedition_draws enable row level security;
revoke all on public.pq_expedition_draws from public,anon,authenticated;
grant select on public.pq_expedition_draws to authenticated;
create policy pq_expedition_draws_read on public.pq_expedition_draws for select to authenticated using ((select auth.uid())=user_id);
-- Both spending operations take the exact existing account lock.
create function pq_expedition_private.balance(p_uid uuid) returns bigint
language sql stable security invoker set search_path='' as $$
 select coalesce((select sum(case split_part(receipt_id,':',4) when 'step1' then 5 when 'step2' then 8 when 'step3' then 12 when 'chest' then 15 when 'normal' then 10 when 'boss' then 30 when 'weekly' then 25 when 'hidden' then 40 else 0 end) from public.pq_expedition_receipts where user_id=p_uid),0)
 -coalesce((select sum(case item_id when 'sword' then 60 when 'shield' then 55 when 'cloak' then 45 when 'crown' then 100 when 'compass' then 35 when 'lantern' then 25 when 'title' then 80 when 'relic' then 120 else 0 end) from public.pq_expedition_purchases where user_id=p_uid),0)
 -20*(select count(*) from public.pq_expedition_draws where user_id=p_uid)
$$;
revoke all on function pq_expedition_private.balance(uuid) from public,anon,authenticated;
create function pq_expedition_private.buy_item(p_item text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); price integer;
begin
 if uid is null then raise exception 'Authentication required';end if;
 price:=case p_item when 'sword' then 60 when 'shield' then 55 when 'cloak' then 45 when 'crown' then 100 when 'compass' then 35 when 'lantern' then 25 when 'title' then 80 when 'relic' then 120 else null end;
 if price is null then raise exception 'Invalid item';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pq9-shop:'||uid::text,0));
 if exists(select 1 from public.pq_expedition_purchases where user_id=uid and item_id=p_item) then return jsonb_build_object('status','duplicate');end if;
 if pq_expedition_private.balance(uid)<price then return jsonb_build_object('status','insufficient');end if;
 insert into public.pq_expedition_purchases(user_id,item_id) values(uid,p_item);
 return jsonb_build_object('status','purchased');
end$$;
revoke all on function pq_expedition_private.buy_item(text) from public,anon,authenticated;
grant execute on function pq_expedition_private.buy_item(text) to authenticated;
create or replace function public.pq_buy_expedition_item(p_item text) returns jsonb
language sql security invoker set search_path='' as $$select pq_expedition_private.buy_item(p_item)$$;
revoke all on function public.pq_buy_expedition_item(text) from public,anon,authenticated;
grant execute on function public.pq_buy_expedition_item(text) to authenticated;
create function pq_expedition_private.draw_item(p_request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous public.pq_expedition_draws%rowtype; seq integer; last_ur integer; roll integer; rarity text; item text;
begin
 if uid is null then raise exception 'Authentication required';end if;
 if p_request is null then raise exception 'Request ID required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pq9-shop:'||uid::text,0));
 select * into previous from public.pq_expedition_draws where user_id=uid and request_id=p_request;
 if found then return jsonb_build_object('status','duplicate','draw_no',previous.draw_no,'request_id',previous.request_id,'item_id',previous.item_id);end if;
 if pq_expedition_private.balance(uid)<20 then return jsonb_build_object('status','insufficient');end if;
 select coalesce(max(draw_no),0)+1,coalesce(max(draw_no) filter(where item_id in ('ur1','ur2')),0) into seq,last_ur from public.pq_expedition_draws where user_id=uid;
 if seq>50000 then raise exception 'Draw limit reached';end if;
 roll:=floor(pg_catalog.random()*10000)::integer;
 rarity:=case when seq-last_ur>=20 or roll<300 then 'ur' when roll<1000 then 'ssr' when roll<3000 then 'sr' when roll<6000 then 'r' else 'n' end;
 item:=rarity||(1+floor(pg_catalog.random()*2)::integer)::text;
 insert into public.pq_expedition_draws(user_id,draw_no,request_id,item_id) values(uid,seq,p_request,item);
 return jsonb_build_object('status','drawn','draw_no',seq,'request_id',p_request,'item_id',item);
end$$;
revoke all on function pq_expedition_private.draw_item(uuid) from public,anon,authenticated;
grant execute on function pq_expedition_private.draw_item(uuid) to authenticated;
create function public.pq_draw_expedition_item(p_request uuid) returns jsonb
language sql security invoker set search_path='' as $$select pq_expedition_private.draw_item(p_request)$$;
revoke all on function public.pq_draw_expedition_item(uuid) from public,anon,authenticated;
grant execute on function public.pq_draw_expedition_item(uuid) to authenticated;
commit;
 or receipt_id ~ '^v2:[0-9]{4}-[0-9]{2}-[0-9]{2}:all:hiddencreate schema if not exists pq_expedition_private;
revoke all on schema pq_expedition_private from public,anon,authenticated;
grant usage on schema pq_expedition_private to authenticated;
create table public.pq_expedition_draws (
 user_id uuid not null references auth.users(id) on delete cascade,
 draw_no integer not null check(draw_no between 1 and 50000),
 request_id uuid not null,
 item_id text not null check(item_id in ('n1','n2','r1','r2','sr1','sr2','ssr1','ssr2','ur1','ur2')),
 created_at timestamptz not null default now(),
 primary key(user_id,draw_no), unique(user_id,request_id)
);
alter table public.pq_expedition_draws enable row level security;
revoke all on public.pq_expedition_draws from public,anon,authenticated;
grant select on public.pq_expedition_draws to authenticated;
create policy pq_expedition_draws_read on public.pq_expedition_draws for select to authenticated using ((select auth.uid())=user_id);
-- Both spending operations take the exact existing account lock.
create function pq_expedition_private.balance(p_uid uuid) returns bigint
language sql stable security invoker set search_path='' as $$
 select coalesce((select sum(case split_part(receipt_id,':',4) when 'step1' then 5 when 'step2' then 8 when 'step3' then 12 when 'chest' then 15 when 'normal' then 10 when 'boss' then 30 when 'weekly' then 25 else 0 end) from public.pq_expedition_receipts where user_id=p_uid),0)
 -coalesce((select sum(case item_id when 'sword' then 60 when 'shield' then 55 when 'cloak' then 45 when 'crown' then 100 when 'compass' then 35 when 'lantern' then 25 when 'title' then 80 when 'relic' then 120 else 0 end) from public.pq_expedition_purchases where user_id=p_uid),0)
 -20*(select count(*) from public.pq_expedition_draws where user_id=p_uid)
$$;
revoke all on function pq_expedition_private.balance(uuid) from public,anon,authenticated;
create function pq_expedition_private.buy_item(p_item text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); price integer;
begin
 if uid is null then raise exception 'Authentication required';end if;
 price:=case p_item when 'sword' then 60 when 'shield' then 55 when 'cloak' then 45 when 'crown' then 100 when 'compass' then 35 when 'lantern' then 25 when 'title' then 80 when 'relic' then 120 else null end;
 if price is null then raise exception 'Invalid item';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pq9-shop:'||uid::text,0));
 if exists(select 1 from public.pq_expedition_purchases where user_id=uid and item_id=p_item) then return jsonb_build_object('status','duplicate');end if;
 if pq_expedition_private.balance(uid)<price then return jsonb_build_object('status','insufficient');end if;
 insert into public.pq_expedition_purchases(user_id,item_id) values(uid,p_item);
 return jsonb_build_object('status','purchased');
end$$;
revoke all on function pq_expedition_private.buy_item(text) from public,anon,authenticated;
grant execute on function pq_expedition_private.buy_item(text) to authenticated;
create or replace function public.pq_buy_expedition_item(p_item text) returns jsonb
language sql security invoker set search_path='' as $$select pq_expedition_private.buy_item(p_item)$$;
revoke all on function public.pq_buy_expedition_item(text) from public,anon,authenticated;
grant execute on function public.pq_buy_expedition_item(text) to authenticated;
create function pq_expedition_private.draw_item(p_request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous public.pq_expedition_draws%rowtype; seq integer; last_ur integer; roll integer; rarity text; item text;
begin
 if uid is null then raise exception 'Authentication required';end if;
 if p_request is null then raise exception 'Request ID required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pq9-shop:'||uid::text,0));
 select * into previous from public.pq_expedition_draws where user_id=uid and request_id=p_request;
 if found then return jsonb_build_object('status','duplicate','draw_no',previous.draw_no,'request_id',previous.request_id,'item_id',previous.item_id);end if;
 if pq_expedition_private.balance(uid)<20 then return jsonb_build_object('status','insufficient');end if;
 select coalesce(max(draw_no),0)+1,coalesce(max(draw_no) filter(where item_id in ('ur1','ur2')),0) into seq,last_ur from public.pq_expedition_draws where user_id=uid;
 if seq>50000 then raise exception 'Draw limit reached';end if;
 roll:=floor(pg_catalog.random()*10000)::integer;
 rarity:=case when seq-last_ur>=20 or roll<300 then 'ur' when roll<1000 then 'ssr' when roll<3000 then 'sr' when roll<6000 then 'r' else 'n' end;
 item:=rarity||(1+floor(pg_catalog.random()*2)::integer)::text;
 insert into public.pq_expedition_draws(user_id,draw_no,request_id,item_id) values(uid,seq,p_request,item);
 return jsonb_build_object('status','drawn','draw_no',seq,'request_id',p_request,'item_id',item);
end$$;
revoke all on function pq_expedition_private.draw_item(uuid) from public,anon,authenticated;
grant execute on function pq_expedition_private.draw_item(uuid) to authenticated;
create function public.pq_draw_expedition_item(p_request uuid) returns jsonb
language sql security invoker set search_path='' as $$select pq_expedition_private.draw_item(p_request)$$;
revoke all on function public.pq_draw_expedition_item(uuid) from public,anon,authenticated;
grant execute on function public.pq_draw_expedition_item(uuid) to authenticated;
commit;
));
create schema if not exists pq_expedition_private;
revoke all on schema pq_expedition_private from public,anon,authenticated;
grant usage on schema pq_expedition_private to authenticated;
create table public.pq_expedition_draws (
 user_id uuid not null references auth.users(id) on delete cascade,
 draw_no integer not null check(draw_no between 1 and 50000),
 request_id uuid not null,
 item_id text not null check(item_id in ('n1','n2','r1','r2','sr1','sr2','ssr1','ssr2','ur1','ur2')),
 created_at timestamptz not null default now(),
 primary key(user_id,draw_no), unique(user_id,request_id)
);
alter table public.pq_expedition_draws enable row level security;
revoke all on public.pq_expedition_draws from public,anon,authenticated;
grant select on public.pq_expedition_draws to authenticated;
create policy pq_expedition_draws_read on public.pq_expedition_draws for select to authenticated using ((select auth.uid())=user_id);
-- Both spending operations take the exact existing account lock.
create function pq_expedition_private.balance(p_uid uuid) returns bigint
language sql stable security invoker set search_path='' as $$
 select coalesce((select sum(case split_part(receipt_id,':',4) when 'step1' then 5 when 'step2' then 8 when 'step3' then 12 when 'chest' then 15 when 'normal' then 10 when 'boss' then 30 when 'weekly' then 25 else 0 end) from public.pq_expedition_receipts where user_id=p_uid),0)
 -coalesce((select sum(case item_id when 'sword' then 60 when 'shield' then 55 when 'cloak' then 45 when 'crown' then 100 when 'compass' then 35 when 'lantern' then 25 when 'title' then 80 when 'relic' then 120 else 0 end) from public.pq_expedition_purchases where user_id=p_uid),0)
 -20*(select count(*) from public.pq_expedition_draws where user_id=p_uid)
$$;
revoke all on function pq_expedition_private.balance(uuid) from public,anon,authenticated;
create function pq_expedition_private.buy_item(p_item text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); price integer;
begin
 if uid is null then raise exception 'Authentication required';end if;
 price:=case p_item when 'sword' then 60 when 'shield' then 55 when 'cloak' then 45 when 'crown' then 100 when 'compass' then 35 when 'lantern' then 25 when 'title' then 80 when 'relic' then 120 else null end;
 if price is null then raise exception 'Invalid item';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pq9-shop:'||uid::text,0));
 if exists(select 1 from public.pq_expedition_purchases where user_id=uid and item_id=p_item) then return jsonb_build_object('status','duplicate');end if;
 if pq_expedition_private.balance(uid)<price then return jsonb_build_object('status','insufficient');end if;
 insert into public.pq_expedition_purchases(user_id,item_id) values(uid,p_item);
 return jsonb_build_object('status','purchased');
end$$;
revoke all on function pq_expedition_private.buy_item(text) from public,anon,authenticated;
grant execute on function pq_expedition_private.buy_item(text) to authenticated;
create or replace function public.pq_buy_expedition_item(p_item text) returns jsonb
language sql security invoker set search_path='' as $$select pq_expedition_private.buy_item(p_item)$$;
revoke all on function public.pq_buy_expedition_item(text) from public,anon,authenticated;
grant execute on function public.pq_buy_expedition_item(text) to authenticated;
create function pq_expedition_private.draw_item(p_request uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous public.pq_expedition_draws%rowtype; seq integer; last_ur integer; roll integer; rarity text; item text;
begin
 if uid is null then raise exception 'Authentication required';end if;
 if p_request is null then raise exception 'Request ID required';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pq9-shop:'||uid::text,0));
 select * into previous from public.pq_expedition_draws where user_id=uid and request_id=p_request;
 if found then return jsonb_build_object('status','duplicate','draw_no',previous.draw_no,'request_id',previous.request_id,'item_id',previous.item_id);end if;
 if pq_expedition_private.balance(uid)<20 then return jsonb_build_object('status','insufficient');end if;
 select coalesce(max(draw_no),0)+1,coalesce(max(draw_no) filter(where item_id in ('ur1','ur2')),0) into seq,last_ur from public.pq_expedition_draws where user_id=uid;
 if seq>50000 then raise exception 'Draw limit reached';end if;
 roll:=floor(pg_catalog.random()*10000)::integer;
 rarity:=case when seq-last_ur>=20 or roll<300 then 'ur' when roll<1000 then 'ssr' when roll<3000 then 'sr' when roll<6000 then 'r' else 'n' end;
 item:=rarity||(1+floor(pg_catalog.random()*2)::integer)::text;
 insert into public.pq_expedition_draws(user_id,draw_no,request_id,item_id) values(uid,seq,p_request,item);
 return jsonb_build_object('status','drawn','draw_no',seq,'request_id',p_request,'item_id',item);
end$$;
revoke all on function pq_expedition_private.draw_item(uuid) from public,anon,authenticated;
grant execute on function pq_expedition_private.draw_item(uuid) to authenticated;
create function public.pq_draw_expedition_item(p_request uuid) returns jsonb
language sql security invoker set search_path='' as $$select pq_expedition_private.draw_item(p_request)$$;
revoke all on function public.pq_draw_expedition_item(uuid) from public,anon,authenticated;
grant execute on function public.pq_draw_expedition_item(uuid) to authenticated;
commit;
