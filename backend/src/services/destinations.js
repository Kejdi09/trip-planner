const { geocodeCityFromQuery } = require('./mapbox');

async function resolveDestinationPlaceIdFromName(supabaseAdmin, name) {
  const resolved = await geocodeCityFromQuery(name);
  if (!resolved?.city || !resolved?.country) return null;
  const city = resolved.city.trim();
  const country = resolved.country.trim();

  const { data: existing } = await supabaseAdmin
    .from('places')
    .select('id')
    .ilike('city', city)
    .ilike('country', country)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from('places')
    .insert({ name: city, city, country, description: null })
    .select('id')
    .single();

  if (error) return null;
  return created?.id ?? null;
}

async function ensureGroupDestinationPlace(supabaseAdmin, group) {
  if (!group) return null;
  if (group.destination_place_id) {
    const { data } = await supabaseAdmin.from('places').select('id,name,city,country').eq('id', group.destination_place_id).maybeSingle();
    if (data) return data;
  }

  const placeId = await resolveDestinationPlaceIdFromName(supabaseAdmin, group.name);
  if (!placeId) return null;

  await supabaseAdmin.from('groups').update({ destination_place_id: placeId }).eq('id', group.id);
  const { data } = await supabaseAdmin.from('places').select('id,name,city,country').eq('id', placeId).maybeSingle();
  return data || null;
}

module.exports = { resolveDestinationPlaceIdFromName, ensureGroupDestinationPlace };
