-- 倒数日：可选图标，存 src/tools/countdown/icons.ts 里的 key。
-- 空串 = 没选，列表按"是否重复"回退到日历 / 循环图标。
alter table public.countdown_events
  add column if not exists icon text not null default '';
