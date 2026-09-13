-- daotin-tools 初始化：四张业务表 + 行级权限（RLS）
-- 可重复执行：建表用 if not exists，策略先 drop 再 create。

-- ===== 表 =====

create table if not exists public.quit_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  name text not null,
  start_at timestamptz not null
);

create table if not exists public.quit_relapses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  item_id uuid not null references public.quit_items (id) on delete cascade,
  relapsed_at timestamptz not null,
  note text,
  legacy_id text
);

create table if not exists public.countdown_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  title text not null,
  "date" date not null,
  is_lunar boolean not null default false,
  "repeat" text not null default 'none'
    check ("repeat" in ('none', 'yearly', 'monthly', 'weekly')),
  category text not null default '',
  pinned boolean not null default false,
  note text
);

create table if not exists public.periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  start_date date not null,
  end_date date
);

-- ===== 索引 =====

-- AntiX 导入去重：同一用户的同一条原始记录只允许存在一条。
-- legacy_id 可空，所以用部分索引，非导入的记录不受约束。
create unique index if not exists quit_relapses_user_legacy_key
  on public.quit_relapses (user_id, legacy_id)
  where legacy_id is not null;

create index if not exists quit_relapses_item_id_idx
  on public.quit_relapses (item_id);

-- ===== 行级权限 =====

alter table public.quit_items enable row level security;
alter table public.quit_relapses enable row level security;
alter table public.countdown_events enable row level security;
alter table public.periods enable row level security;

-- quit_items
drop policy if exists quit_items_select on public.quit_items;
create policy quit_items_select on public.quit_items
  for select using (auth.uid() = user_id);

drop policy if exists quit_items_insert on public.quit_items;
create policy quit_items_insert on public.quit_items
  for insert with check (auth.uid() = user_id);

drop policy if exists quit_items_update on public.quit_items;
create policy quit_items_update on public.quit_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists quit_items_delete on public.quit_items;
create policy quit_items_delete on public.quit_items
  for delete using (auth.uid() = user_id);

-- quit_relapses：除了自己的行，还要求被引用的戒断项也属于自己，
-- 防止把记录挂到别人的 quit_items 上。
drop policy if exists quit_relapses_select on public.quit_relapses;
create policy quit_relapses_select on public.quit_relapses
  for select using (auth.uid() = user_id);

drop policy if exists quit_relapses_insert on public.quit_relapses;
create policy quit_relapses_insert on public.quit_relapses
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.quit_items i
      where i.id = item_id and i.user_id = auth.uid()
    )
  );

drop policy if exists quit_relapses_update on public.quit_relapses;
create policy quit_relapses_update on public.quit_relapses
  for update using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.quit_items i
      where i.id = item_id and i.user_id = auth.uid()
    )
  );

drop policy if exists quit_relapses_delete on public.quit_relapses;
create policy quit_relapses_delete on public.quit_relapses
  for delete using (auth.uid() = user_id);

-- countdown_events
drop policy if exists countdown_events_select on public.countdown_events;
create policy countdown_events_select on public.countdown_events
  for select using (auth.uid() = user_id);

drop policy if exists countdown_events_insert on public.countdown_events;
create policy countdown_events_insert on public.countdown_events
  for insert with check (auth.uid() = user_id);

drop policy if exists countdown_events_update on public.countdown_events;
create policy countdown_events_update on public.countdown_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists countdown_events_delete on public.countdown_events;
create policy countdown_events_delete on public.countdown_events
  for delete using (auth.uid() = user_id);

-- periods
drop policy if exists periods_select on public.periods;
create policy periods_select on public.periods
  for select using (auth.uid() = user_id);

drop policy if exists periods_insert on public.periods;
create policy periods_insert on public.periods
  for insert with check (auth.uid() = user_id);

drop policy if exists periods_update on public.periods;
create policy periods_update on public.periods
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists periods_delete on public.periods;
create policy periods_delete on public.periods
  for delete using (auth.uid() = user_id);
