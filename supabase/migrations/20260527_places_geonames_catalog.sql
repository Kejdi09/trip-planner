alter table places
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists city varchar,
  add column if not exists country varchar,
  add column if not exists country_code text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists population integer,
  add column if not exists image_url text,
  add column if not exists image_source text,
  add column if not exists image_author text,
  add column if not exists image_author_url text,
  add column if not exists image_fetched_at timestamptz,
  add column if not exists search_text text;

drop index if exists places_external_source_external_id_unique_idx;
create unique index if not exists places_external_source_external_id_unique_idx
  on places (external_source, external_id);

create index if not exists places_city_lower_idx
  on places (lower(city));

create index if not exists places_country_lower_idx
  on places (lower(country));

create index if not exists places_name_lower_idx
  on places (lower(name));

create index if not exists places_search_text_lower_idx
  on places (lower(search_text));
