#!/usr/bin/env bash
set -euo pipefail
: "PG_CONTAINER"
psql_ci(){ docker exec -i "$PG_CONTAINER" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"; }
psql_ci <<'SQL'
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated,anon;
insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
SQL
psql_ci < supabase/migrations/20261124_expedition_receipts.sql
psql_ci < supabase/migrations/20261125_expedition_shop.sql
psql_ci < supabase/migrations/20261126_expedition_gacha.sql
psql_ci <<'SQL'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
insert into public.pq_expedition_receipts(user_id,receipt_id) values
 (auth.uid(),'v1:2026-11-23:market:boss'),(auth.uid(),'v1:2026-11-23:trail:boss')
 on conflict do nothing;
insert into public.pq_expedition_receipts(user_id,receipt_id) values(auth.uid(),'v1:2026-11-23:market:boss') on conflict do nothing;
do $$begin
 if (select count(*) from public.pq_expedition_receipts)<>2 then raise exception 'duplicate receipt'; end if;
 begin
  insert into public.pq_expedition_receipts values('00000000-0000-0000-0000-000000000002','v1:2026-11-23:market:boss',now());
  raise exception 'cross-account insert allowed';
 exception when insufficient_privilege then null;end;
 begin
  delete from public.pq_expedition_receipts;
  raise exception 'delete allowed';
 exception when insufficient_privilege then null;end;
 begin
  insert into public.pq_expedition_purchases(user_id,item_id) values(auth.uid(),'sword');
  raise exception 'direct purchase allowed';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$begin
 if (select count(*) from public.pq_expedition_receipts)<>0 then raise exception 'cross-account read';end if;
 if public.pq_buy_expedition_item('lantern')->>'status'<>'insufficient' then raise exception 'zero balance purchase';end if;
end$$;
SQL
buy(){ psql_ci -At <<SQL
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.pq_buy_expedition_item('$1')->>'status';
SQL
}
a=$(mktemp);b=$(mktemp);trap 'rm -f "$a" "$b"' EXIT
buy sword > "$a" & pa=$!
buy shield > "$b" & pb=$!
wait "$pa";wait "$pb"
test "$(cat "$a" "$b" | grep -xc purchased)" -eq 1
test "$(cat "$a" "$b" | grep -xc insufficient)" -eq 1
psql_ci <<'SQL'
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$declare id text;begin
 if (select count(*) from public.pq_expedition_purchases)<>1 then raise exception 'double spend';end if;
 select item_id into id from public.pq_expedition_purchases;
 if public.pq_buy_expedition_item(id)->>'status'<>'duplicate' then raise exception 'duplicate purchase';end if;
end$$;
SQL
echo 'PASS isolated PostgreSQL migrations, RLS, duplicate receipt, concurrent purchases'

# A separate account can afford exactly one draw or one sword, not both.
psql_ci <<'SQL'
insert into public.pq_expedition_receipts(user_id,receipt_id) values
 ('00000000-0000-0000-0000-000000000002','v1:2026-11-23:market:boss'),
 ('00000000-0000-0000-0000-000000000002','v1:2026-11-23:trail:boss');
SQL
spend2(){ psql_ci -At <<SQL
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select $1->>'status';
SQL
}
spend2 "public.pq_draw_expedition_item('00000000-0000-0000-0000-000000000100')" > "$a" & pa=$!
spend2 "public.pq_buy_expedition_item('sword')" > "$b" & pb=$!
wait "$pa";wait "$pb"
test "$(cat "$a" "$b" | grep -Ec '^(drawn|purchased)$')" -eq 1
test "$(cat "$a" "$b" | grep -xc insufficient)" -eq 1
psql_ci <<'SQL'
-- Prepare a dedicated pity fixture with sufficient earned balance.
insert into auth.users values('00000000-0000-0000-0000-000000000003');
insert into public.pq_expedition_receipts(user_id,receipt_id)
select '00000000-0000-0000-0000-000000000003','v1:'||to_char(date '2026-11-23'-7*i,'YYYY-MM-DD')||':all:weekly' from generate_series(0,15) i;
insert into public.pq_expedition_draws(user_id,draw_no,request_id,item_id)
select '00000000-0000-0000-0000-000000000003',i,('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'n1' from generate_series(1,19) i;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
do $$declare a jsonb;b jsonb;begin
 if (select count(*) from public.pq_expedition_draws)<>19 then raise exception 'cross account draw read';end if;
 a:=public.pq_draw_expedition_item('00000000-0000-0000-0000-000000000020');
 b:=public.pq_draw_expedition_item('00000000-0000-0000-0000-000000000020');
 if a->>'status'<>'drawn' or a->>'item_id' not in ('ur1','ur2') or b->>'status'<>'duplicate' or a->>'item_id'<>b->>'item_id' then raise exception 'pity/idempotency failure';end if;
 if (select count(*) from public.pq_expedition_draws)<>20 then raise exception 'duplicate draw';end if;
 if public.pq_draw_expedition_item('00000000-0000-0000-0000-000000000021')->>'status'<>'insufficient' then raise exception 'overspend';end if;
 begin
  insert into public.pq_expedition_draws(user_id,draw_no,request_id,item_id) values(auth.uid(),21,'00000000-0000-0000-0000-000000000021','ur1');
  raise exception 'direct insert allowed';
 exception when insufficient_privilege then null;end;
end$$;
reset role;
set role anon;
do $$begin
 begin
  perform public.pq_draw_expedition_item('00000000-0000-0000-0000-000000000022');
  raise exception 'anonymous draw allowed';
 exception when insufficient_privilege then null;end;
end$$;
SQL
echo 'PASS gacha RLS, shared wallet race, pity, idempotency and direct write protection'
