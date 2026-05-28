alter table friendships enable row level security;

drop policy if exists "Users can delete their own friendships" on friendships;
create policy "Users can delete their own friendships"
on friendships
for delete
to authenticated
using (
  auth.uid() = requester_id or auth.uid() = receiver_id
);
