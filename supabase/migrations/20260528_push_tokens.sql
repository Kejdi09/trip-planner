create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  token text not null unique,
  platform text null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists push_tokens_user_idx
  on push_tokens (user_id);
