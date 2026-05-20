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
