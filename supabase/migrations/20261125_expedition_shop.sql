-- Apply only after receipt migration and review in a test project.
begin;
create table if not exists public.pq_expedition_purchases (
 user_id uuid not null references auth.users(id) on delete cascade,
 item_id text not null check (item_id in ('sword','shield','cloak','crown','compass','lantern','title','relic')),
 created_at timestamptz not null default now(),
 primary key(user_id,item_id)
);
alter table public.pq_expedition_purchases enable row level security;
revoke all on public.pq_expedition_purchases from public, anon, authenticated;
grant select on public.pq_expedition_purchases to authenticated;
drop policy if exists pq_expedition_purchases_read on public.pq_expedition_purchases;
create policy pq_expedition_purchases_read on public.pq_expedition_purchases for select to authenticated using ((select auth.uid())=user_id);
create or replace function public.pq_buy_expedition_item(p_item text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 uid uuid := auth.uid();
 price integer;
 earned bigint;
 spent bigint;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 price := case p_item when 'sword' then 60 when 'shield' then 55 when 'cloak' then 45 when 'crown' then 100 when 'compass' then 35 when 'lantern' then 25 when 'title' then 80 when 'relic' then 120 else null end;
 if price is null then raise exception 'Invalid item'; end if;
 -- Serialize all purchases for this account in the same DB transaction.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pq9-shop:'||uid::text,0));
 if exists(select 1 from public.pq_expedition_purchases where user_id=uid and item_id=p_item) then
  return jsonb_build_object('status','duplicate');
 end if;
 select coalesce(sum(case split_part(receipt_id,':',4) when 'step1' then 5 when 'step2' then 8 when 'step3' then 12 when 'chest' then 15 when 'normal' then 10 when 'boss' then 30 when 'weekly' then 25 else 0 end),0) into earned from public.pq_expedition_receipts where user_id=uid;
 select coalesce(sum(case item_id when 'sword' then 60 when 'shield' then 55 when 'cloak' then 45 when 'crown' then 100 when 'compass' then 35 when 'lantern' then 25 when 'title' then 80 when 'relic' then 120 else 0 end),0) into spent from public.pq_expedition_purchases where user_id=uid;
 if earned-spent<price then return jsonb_build_object('status','insufficient'); end if;
 insert into public.pq_expedition_purchases(user_id,item_id) values(uid,p_item);
 return jsonb_build_object('status','purchased');
end;
$$;
revoke all on function public.pq_buy_expedition_item(text) from public, anon, authenticated;
grant execute on function public.pq_buy_expedition_item(text) to authenticated;
commit;
