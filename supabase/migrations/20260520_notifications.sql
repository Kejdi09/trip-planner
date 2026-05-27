-- Notifications table for in-app notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text,
  body text,
  related_entity_id uuid null,
  related_entity_type text null,
  content text,
  is_read boolean not null default false,
  created_at timestamp not null default now()
);

create index if not exists notifications_user_created_idx
  on notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on notifications (user_id, is_read);

alter table notifications
  add column if not exists related_entity_type text null,
  add column if not exists related_entity_id uuid null,
  add column if not exists title text,
  add column if not exists body text;

create unique index if not exists notifications_dedupe_idx
  on notifications (user_id, type, related_entity_type, related_entity_id)
  where related_entity_id is not null;

create table if not exists group_chat_reads (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamp not null default now(),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  unique (group_id, user_id)
);
