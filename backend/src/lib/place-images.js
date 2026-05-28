const { pexelsApiKey } = require('../config');

const PEXELS_ENDPOINT = 'https://api.pexels.com/v1/search';

function buildQuery(place) {
  const city = String(place.city || place.name || '').trim();
  const country = String(place.country || '').trim();
  return city && country ? `${city} ${country} travel city` : `${city || country} city`;
}

async function fetchPexelsImageForPlace(place) {
  if (!pexelsApiKey) return null;
  const query = buildQuery(place);
  if (!query.trim()) return null;

  const url = new URL(PEXELS_ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('per_page', '10');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: pexelsApiKey },
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const photos = Array.isArray(payload?.photos) ? payload.photos : [];
  return photos
    .map((photo) => ({
      image_url: photo?.src?.large2x || photo?.src?.large || photo?.src?.original || null,
      image_source: 'pexels',
      image_author: photo?.photographer || null,
      image_author_url: photo?.photographer_url || null,
    }))
    .filter((item) => Boolean(item.image_url));
}

module.exports = {
  fetchPexelsImageForPlace,
  hasPexelsApiKey: Boolean(pexelsApiKey),
};
