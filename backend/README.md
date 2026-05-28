# Backend scripts

## GeoNames city catalog import (manual)

This project can import world cities from GeoNames into the existing `places` table.

1. Download GeoNames `cities1000.zip` from GeoNames and unzip it to:
   - `data/cities1000.txt`
2. Download GeoNames `countryInfo.txt` and place it at:
   - `data/countryInfo.txt`
3. Confirm `data/` is ignored by git (it is listed in `.gitignore`).
4. Run the Supabase migration(s) so `places` has catalog columns/indexes.
5. Run the importer manually:

```bash
node backend/scripts/import-geonames-cities.js
```

Optional custom paths:

```bash
node backend/scripts/import-geonames-cities.js /absolute/path/cities1000.txt /absolute/path/countryInfo.txt
```

Notes:
- The script is idempotent via upsert conflict target `(external_source, external_id)`.
- It does **not** run automatically; execute it only when you want to import/update catalog data.
