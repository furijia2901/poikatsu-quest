-- Optional deployment migration. Do not run against production without review.
-- Separate from quest_saves so old clients cannot overwrite expedition receipts.
begin;
create table if not exists public.pq_expedition_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  receipt_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, receipt_id),
  constraint pq_expedition_receipt_format check (
    receipt_id ~ '^v1:[0-9]{4}-[0-9]{2}-[0-9]{2}:((market|trail|citadel):(step1|step2|step3|chest|normal|boss)|all:weekly)$'
    and length(receipt_id) <= 64
  )
);
alter table public.pq_expedition_receipts enable row level security;
revoke all on public.pq_expedition_receipts from anon, authenticated;
grant select, insert on public.pq_expedition_receipts to authenticated;
drop policy if exists pq_expedition_read_own on public.pq_expedition_receipts;
create policy pq_expedition_read_own on public.pq_expedition_receipts
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists pq_expedition_insert_own on public.pq_expedition_receipts;
create policy pq_expedition_insert_own on public.pq_expedition_receipts
  for insert to authenticated with check ((select auth.uid()) = user_id);
commit;
