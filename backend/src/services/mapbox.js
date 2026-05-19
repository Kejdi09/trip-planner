const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

function normalizeText(value) {
  return String(value || '').trim();
}

function parseCityCountry(feature) {
  if (!feature) return null;
  const city = normalizeText(feature.text || feature.place_name?.split(',')[0]);
  const countryContext = (feature.context || []).find((ctx) => String(ctx.id || '').startsWith('country.'));
  const country = normalizeText(countryContext?.text);
  if (!city || !country) return null;
  return { city, country };
}

async function geocodeCityFromQuery(query) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  const q = normalizeText(query);
  if (!q) return null;

  const url = `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(q)}.json?access_token=${encodeURIComponent(token)}&types=place&limit=1`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const payload = await response.json();
  const feature = Array.isArray(payload?.features) ? payload.features[0] : null;
  return parseCityCountry(feature);
}

module.exports = { geocodeCityFromQuery };
