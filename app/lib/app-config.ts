type AppEnv = 'development' | 'production';

const PROD_ALIASES = new Set(['prod', 'production', 'main']);
const PREVIEW_ALIASES = new Set(['preview', 'staging']);
const rawEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development').trim().toLowerCase();

export const APP_ENV: AppEnv = PROD_ALIASES.has(rawEnv)
  ? 'production'
  : PREVIEW_ALIASES.has(rawEnv)
    ? 'development'
    : 'development';

const sharedSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const sharedSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const sharedApiUrl = process.env.EXPO_PUBLIC_API_URL;
const sharedAppUrl = process.env.EXPO_PUBLIC_APP_URL;
const sharedReviewPhotoBucket = process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET;

const devSupabaseUrl =
  sharedSupabaseUrl ??
  process.env.EXPO_PUBLIC_SUPABASE_URL_DEV ??
  process.env.EXPO_PUBLIC_SUPABASE_URL_STAGING;
const devSupabaseAnonKey =
  sharedSupabaseAnonKey ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING;
const devApiUrl =
  sharedApiUrl ?? process.env.EXPO_PUBLIC_API_URL_DEV ?? process.env.EXPO_PUBLIC_API_URL_STAGING;
const devAppUrl =
  sharedAppUrl ?? process.env.EXPO_PUBLIC_APP_URL_DEV ?? process.env.EXPO_PUBLIC_APP_URL_STAGING;
const devReviewPhotoBucket =
  sharedReviewPhotoBucket ??
  process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET_PREVIEW ??
  process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET_DEV ??
  process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET_STAGING;

const prodSupabaseUrl = sharedSupabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL_PROD;
const prodSupabaseAnonKey = sharedSupabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD;
const prodApiUrl = sharedApiUrl ?? process.env.EXPO_PUBLIC_API_URL_PROD;
const prodAppUrl = sharedAppUrl ?? process.env.EXPO_PUBLIC_APP_URL_PROD;
const prodReviewPhotoBucket =
  sharedReviewPhotoBucket ?? process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET_PROD;

const selectedSupabaseUrl = APP_ENV === 'production' ? prodSupabaseUrl : devSupabaseUrl;
const selectedSupabaseAnonKey = APP_ENV === 'production' ? prodSupabaseAnonKey : devSupabaseAnonKey;
const selectedApiBaseUrl = APP_ENV === 'production' ? prodApiUrl : devApiUrl;
const selectedAppUrl = APP_ENV === 'production' ? prodAppUrl : devAppUrl;
const selectedReviewPhotoBucket =
  APP_ENV === 'production' ? prodReviewPhotoBucket : devReviewPhotoBucket;

if (!selectedSupabaseUrl || !selectedSupabaseAnonKey) {
  throw new Error(
    `Missing Supabase config for ${APP_ENV}. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or ${APP_ENV === 'production' ? '..._PROD' : '..._DEV'} variants).`,
  );
}

if (!selectedApiBaseUrl) {
  throw new Error(
    `Missing API base URL for ${APP_ENV}. Set EXPO_PUBLIC_API_URL (or EXPO_PUBLIC_API_URL_${APP_ENV === 'production' ? 'PROD' : 'DEV'}).`,
  );
}

if (!selectedAppUrl) {
  throw new Error(
    `Missing app URL for ${APP_ENV}. Set EXPO_PUBLIC_APP_URL (or EXPO_PUBLIC_APP_URL_${APP_ENV === 'production' ? 'PROD' : 'DEV'}).`,
  );
}

export const REVIEW_PHOTO_BUCKET: string = selectedReviewPhotoBucket ?? 'reviewPics';

export const SUPABASE_URL: string = selectedSupabaseUrl;
export const SUPABASE_ANON_KEY: string = selectedSupabaseAnonKey;
export const API_BASE_URL: string = selectedApiBaseUrl;
export const APP_URL: string = selectedAppUrl;
