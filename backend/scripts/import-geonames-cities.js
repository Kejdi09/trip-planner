#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl, supabaseServiceKey } = require('../src/config');

const defaultCitiesPath = path.resolve(__dirname, '../../data/cities1000.txt');
const defaultCountryInfoPath = path.resolve(__dirname, '../../data/countryInfo.txt');
const citiesPath = path.resolve(process.argv[2] || defaultCitiesPath);
const countryInfoPath = path.resolve(process.argv[3] || defaultCountryInfoPath);
const BATCH_SIZE = Number(process.env.GEONAMES_IMPORT_BATCH_SIZE || 1000);
const LOG_EVERY = Number(process.env.GEONAMES_IMPORT_LOG_EVERY || 5000);

function normalizeToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');
}

function buildSearchText(cityName, asciiName, countryName, countryCode, alternatenames) {
  const parts = [
    cityName,
    asciiName,
    countryName,
    countryCode,
    ...(alternatenames ? alternatenames.split(',') : []),
  ]
    .map(normalizeToken)
    .filter(Boolean);

  return Array.from(new Set(parts)).join(' ');
}

function loadCountryInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = new Map();

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const cols = trimmed.split('\t');
    const isoCode = cols[0];
    const countryName = cols[4];
    if (isoCode && countryName) {
      map.set(isoCode, countryName);
    }
  });

  return map;
}

async function upsertBatch(supabaseAdmin, batch) {
  if (batch.length === 0) return;
  const { error } = await supabaseAdmin
    .from('places')
    .upsert(batch, { onConflict: 'external_source,external_id' });
  if (error) throw error;
}

async function run() {
  if (!fs.existsSync(citiesPath)) throw new Error(`cities1000 file not found: ${citiesPath}`);
  if (!fs.existsSync(countryInfoPath)) throw new Error(`countryInfo file not found: ${countryInfoPath}`);

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const countryByIso = loadCountryInfo(countryInfoPath);
  const content = fs.readFileSync(citiesPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);

  let batch = [];
  let processed = 0;

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 19) continue;

    const geonameId = cols[0];
    const name = cols[1];
    const asciiName = cols[2];
    const alternateNames = cols[3];
    const latitude = Number(cols[4]);
    const longitude = Number(cols[5]);
    const featureClass = cols[6];
    const countryCode = cols[8];
    const population = Number(cols[14] || 0);

    if (!geonameId || !countryCode || !name) continue;
    if (featureClass !== 'P') continue;

    const cityName = asciiName || name;
    const countryName = countryByIso.get(countryCode) || countryCode;

    batch.push({
      external_source: 'geonames',
      external_id: geonameId,
      name: cityName,
      city: cityName,
      country: countryName,
      country_code: countryCode,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      population: Number.isFinite(population) ? population : 0,
      search_text: buildSearchText(name, asciiName, countryName, countryCode, alternateNames),
    });

    if (batch.length >= BATCH_SIZE) {
      await upsertBatch(supabaseAdmin, batch);
      processed += batch.length;
      if (processed % LOG_EVERY === 0) console.log(`[geonames-import] processed ${processed} cities...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatch(supabaseAdmin, batch);
    processed += batch.length;
  }

  console.log(`[geonames-import] done. upserted ${processed} places.`);
}

run().catch((error) => {
  console.error('[geonames-import] failed:', error);
  process.exit(1);
});
