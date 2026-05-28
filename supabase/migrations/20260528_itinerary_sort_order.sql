alter table public.itinerary_items
add column if not exists sort_order integer;

create index if not exists itinerary_items_group_date_sort_idx
on public.itinerary_items (group_id, date, sort_order);

with ranked as (
  select
    id,
    row_number() over (
      partition by group_id, date
      order by created_at asc, id asc
    ) - 1 as rn
  from public.itinerary_items
  where sort_order is null
)
update public.itinerary_items item
set sort_order = ranked.rn
from ranked
where item.id = ranked.id;
