require('dotenv').config();

const PROD_ALIASES = new Set(['prod', 'production', 'main']);
const rawAppEnv = (process.env.APP_ENV ?? 'development').trim().toLowerCase();

const appEnv = PROD_ALIASES.has(rawAppEnv) ? 'production' : 'development';

const sharedConfig = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
};

const developmentConfig = {
  supabaseUrl:
    sharedConfig.supabaseUrl ??
    process.env.SUPABASE_URL_DEV ??
    process.env.SUPABASE_URL_STAGING,
  supabaseServiceKey:
    sharedConfig.supabaseServiceKey ??
    process.env.SUPABASE_SERVICE_KEY_DEV ??
    process.env.SUPABASE_SERVICE_KEY_STAGING,
};

const productionConfig = {
  supabaseUrl: sharedConfig.supabaseUrl ?? process.env.SUPABASE_URL_PROD,
  supabaseServiceKey:
    sharedConfig.supabaseServiceKey ?? process.env.SUPABASE_SERVICE_KEY_PROD,
};

const selectedConfig = appEnv === 'production' ? productionConfig : developmentConfig;

const missing = [];
if (!selectedConfig.supabaseUrl) missing.push('supabaseUrl');
if (!selectedConfig.supabaseServiceKey) missing.push('supabaseServiceKey');

if (missing.length > 0) {
  throw new Error(
    `Missing backend config for ${appEnv}: ${missing.join(', ')}. ` +
    'Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or environment-specific fallbacks) before starting the backend.',
  );
}

module.exports = {
  appEnv,
  supabaseUrl: selectedConfig.supabaseUrl,
  supabaseServiceKey: selectedConfig.supabaseServiceKey,
};
