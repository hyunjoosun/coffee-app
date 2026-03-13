-- 커피 앱 주문 테이블 (실시간 동기화용)
-- Supabase 대시보드 → SQL Editor에서 이 스크립트를 실행하세요.

-- 1. 주문 테이블 생성
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

-- 2. Row Level Security 활성화
alter table public.orders enable row level security;

-- 3. 익명 사용자 읽기/쓰기 허용 (같은 링크 쓰는 사람끼리 공유)
create policy "Allow anon read and write orders"
  on public.orders
  for all
  to anon
  using (true)
  with check (true);

-- 4. Realtime 구독 활성화 (주문 변경 시 다른 사용자 화면에 반영)
alter publication supabase_realtime add table public.orders;
