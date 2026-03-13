-- 커피 앱 Supabase 스키마 (실시간 동기화용)
-- Supabase 대시보드 → SQL Editor에서 이 스크립트를 통째로 복붙 후 Run 하면 됩니다.
-- 이미 테이블/정책이 있어도 다시 실행해도 에러 나지 않습니다.

-- ========== 1. 주문 (orders) ==========
create table if not exists public.orders (
  id bigint primary key,
  date text not null,
  "time" text,
  shop text not null,
  status text not null,
  count int not null default 0,
  items jsonb not null default '[]',
  selections jsonb not null default '{}',
  requests jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Allow anon read and write orders" on public.orders;
create policy "Allow anon read and write orders"
  on public.orders for all to anon using (true) with check (true);

do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;


-- ========== 2. 팀원 (team_members) ==========
create table if not exists public.team_members (
  id bigint primary key,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

drop policy if exists "Allow anon read and write team_members" on public.team_members;
create policy "Allow anon read and write team_members"
  on public.team_members for all to anon using (true) with check (true);

do $$ begin
  alter publication supabase_realtime add table public.team_members;
exception when duplicate_object then null;
end $$;


-- ========== 3. 카페 (cafes) ==========
create table if not exists public.cafes (
  id bigint primary key,
  name text not null,
  menus jsonb not null default '[]',
  menu_image text,
  created_at timestamptz not null default now()
);

alter table public.cafes enable row level security;

drop policy if exists "Allow anon read and write cafes" on public.cafes;
create policy "Allow anon read and write cafes"
  on public.cafes for all to anon using (true) with check (true);

do $$ begin
  alter publication supabase_realtime add table public.cafes;
exception when duplicate_object then null;
end $$;
