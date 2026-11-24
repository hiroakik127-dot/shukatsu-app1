-- Supabase の「SQL Editor」に、このファイルの中身をそのまま貼り付けて Run します。
-- 何度実行しても大丈夫です（すでにある表や列はそのまま残ります）。

-- ========== タスク（ボード・締切・今日のToDo・ホームで使います） ==========
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  role text not null default '',
  type text not null,
  event text not null default '',
  due date,
  priority smallint check (priority between 1 and 5), -- 志望度（★1〜5、未設定は null）
  done boolean not null default false,               -- 完了したかどうか
  todo_date date,                                    -- 今日のToDoに入れた日（入れていなければ null）
  progress text not null default 'todo' check (progress in ('todo', 'doing')), -- 未着手／作業中
  created_at timestamptz not null default now()
);

-- 前のバージョンで表を作ってある場合に、足りない列を足します
alter table public.tasks
  add column if not exists priority smallint check (priority between 1 and 5);
alter table public.tasks
  add column if not exists done boolean not null default false;
alter table public.tasks
  add column if not exists todo_date date;
alter table public.tasks
  add column if not exists progress text not null default 'todo' check (progress in ('todo', 'doing'));

-- 進捗率（0〜100%）・メモ・チェックリスト
alter table public.tasks
  add column if not exists percent smallint not null default 0 check (percent between 0 and 100);
alter table public.tasks
  add column if not exists memo text not null default '';
alter table public.tasks
  add column if not exists checklist jsonb not null default '[]'::jsonb; -- [{ "id", "title", "items": [{ "id", "text", "done" }] }]（いくつでも作れます）

-- タスクの種類（ES・面接・結果待ち・説明会・GD・Webテスト・インターン・選コミュ）
alter table public.tasks drop constraint if exists tasks_type_check;
alter table public.tasks add constraint tasks_type_check
  check (type in ('es', 'interview', 'result', 'briefing', 'gd', 'webtest', 'intern', 'community'));

-- ========== ESストック ==========
create table if not exists public.es_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,                 -- 設問・タイトル
  company text not null default '',    -- 企業名（空なら「共通」）
  body text not null default '',       -- 本文
  char_limit integer check (char_limit > 0), -- 文字数の上限（任意）
  created_at timestamptz not null default now()
);

-- ========== ログインした人がアプリから使えるようにする権限 ==========
-- （これがないと「permission denied for table ...」になります）
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.es_entries to authenticated;

-- ========== 自分のデータだけ見られるようにする設定（とても大事） ==========
alter table public.tasks enable row level security;
alter table public.es_entries enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

drop policy if exists "es_select_own" on public.es_entries;
drop policy if exists "es_insert_own" on public.es_entries;
drop policy if exists "es_update_own" on public.es_entries;
drop policy if exists "es_delete_own" on public.es_entries;

create policy "es_select_own" on public.es_entries
  for select using (auth.uid() = user_id);
create policy "es_insert_own" on public.es_entries
  for insert with check (auth.uid() = user_id);
create policy "es_update_own" on public.es_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "es_delete_own" on public.es_entries
  for delete using (auth.uid() = user_id);

-- ========== 学びメモ（メモの画面で使います。タスクとは別の表です） ==========
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '',          -- タイトル
  body text not null default '',           -- 本文
  photos jsonb not null default '[]'::jsonb, -- 写真（写真置き場 note-photos の中の場所の一覧）
  done boolean not null default false,  -- 完了したかどうか
  todo_date date,                       -- 今日のToDoに入れた日（入れていなければ null）
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notes to authenticated;
alter table public.notes enable row level security;
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

-- ========== メモの写真の置き場（自分のフォルダの写真だけ見られる・置ける） ==========
-- 写真は「ユーザーID/ファイル名」の場所に置きます
insert into storage.buckets (id, name, public)
values ('note-photos', 'note-photos', false)
on conflict (id) do nothing;
drop policy if exists "note_photos_select_own" on storage.objects;
drop policy if exists "note_photos_insert_own" on storage.objects;
drop policy if exists "note_photos_delete_own" on storage.objects;
create policy "note_photos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "note_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "note_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- アプリがすぐ新しい表・列を認識するように、APIの設定を読み直します
notify pgrst, 'reload schema';

-- ========== 確認 ==========
-- 下の結果で、tasks・es_entries・notes の3つに authenticated の
-- DELETE, INSERT, SELECT, UPDATE が並べば成功です
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('tasks', 'es_entries', 'notes')
  and grantee = 'authenticated'
group by table_name, grantee
order by table_name;
