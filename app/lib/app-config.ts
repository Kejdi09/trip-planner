type AppEnv = "development" | "production";

const PROD_ALIASES = new Set(["prod", "production", "main"]);
const PREVIEW_ALIASES = new Set(["preview", "staging"]);
const rawEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? "development")
  .trim()
  .toLowerCase();

export const APP_ENV: AppEnv = PROD_ALIASES.has(rawEnv)
  ? "production"
  : PREVIEW_ALIASES.has(rawEnv)
    ? "development"
    : "development";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

const sharedSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const sharedSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const sharedApiUrl = process.env.EXPO_PUBLIC_API_URL;
const sharedAppUrl = process.env.EXPO_PUBLIC_APP_URL;
const sharedReviewPhotoBucket = process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET;
const useReviewsBackendRaw = (
  process.env.EXPO_PUBLIC_USE_REVIEWS_BACKEND ?? "true"
)
  .trim()
  .toLowerCase();

const devSupabaseUrl =
  sharedSupabaseUrl ??
  process.env.EXPO_PUBLIC_SUPABASE_URL_DEV ??
  process.env.EXPO_PUBLIC_SUPABASE_URL_STAGING;

const devSupabaseAnonKey =
  sharedSupabaseAnonKey ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING;

const devApiUrl =
  sharedApiUrl ??
  process.env.EXPO_PUBLIC_API_URL_DEV ??
  process.env.EXPO_PUBLIC_API_URL_STAGING;

const devAppUrl =
  sharedAppUrl ??
  process.env.EXPO_PUBLIC_APP_URL_DEV ??
  process.env.EXPO_PUBLIC_APP_URL_STAGING;

const devReviewPhotoBucket =
  sharedReviewPhotoBucket ??
  process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET_PREVIEW ??
  process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET_DEV ??
  process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET_STAGING;

const prodSupabaseUrl =
  sharedSupabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL_PROD;
const prodSupabaseAnonKey =
  sharedSupabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_PROD;
const prodApiUrl = sharedApiUrl ?? process.env.EXPO_PUBLIC_API_URL_PROD;
const prodAppUrl = sharedAppUrl ?? process.env.EXPO_PUBLIC_APP_URL_PROD;
const prodReviewPhotoBucket =
  sharedReviewPhotoBucket ?? process.env.EXPO_PUBLIC_REVIEW_PHOTO_BUCKET_PROD;

const selectedSupabaseUrl =
  APP_ENV === "production" ? prodSupabaseUrl : devSupabaseUrl;
const selectedSupabaseAnonKey =
  APP_ENV === "production" ? prodSupabaseAnonKey : devSupabaseAnonKey;
const selectedApiBaseUrl = APP_ENV === "production" ? prodApiUrl : devApiUrl;
const selectedAppUrl = APP_ENV === "production" ? prodAppUrl : devAppUrl;
const selectedReviewPhotoBucket =
  APP_ENV === "production" ? prodReviewPhotoBucket : devReviewPhotoBucket;

function requireConfig(
  value: string | undefined,
  message: string,
  githubActionsFallback: string,
): string {
  if (value) return value;

  if (isGitHubActions) {
    return githubActionsFallback;
  }

  throw new Error(message);
}

export const REVIEW_PHOTO_BUCKET: string =
  selectedReviewPhotoBucket ?? "reviewPics";
export const USE_REVIEWS_BACKEND: boolean =
  useReviewsBackendRaw === "true" || useReviewsBackendRaw === "1";

export const SUPABASE_URL: string = requireConfig(
  selectedSupabaseUrl,
  `Missing Supabase config for ${APP_ENV}. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or ${APP_ENV === "production" ? "..._PROD" : "..._DEV"} variants).`,
  "https://ci-placeholder.supabase.co",
);

export const SUPABASE_ANON_KEY: string = requireConfig(
  selectedSupabaseAnonKey,
  `Missing Supabase config for ${APP_ENV}. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or ${APP_ENV === "production" ? "..._PROD" : "..._DEV"} variants).`,
  "ci-placeholder-anon-key",
);

export const API_BASE_URL: string = requireConfig(
  selectedApiBaseUrl,
  `Missing API base URL for ${APP_ENV}. Set EXPO_PUBLIC_API_URL (or EXPO_PUBLIC_API_URL_${APP_ENV === "production" ? "PROD" : "DEV"}).`,
  "https://ci-placeholder-api.example.com",
);

export const APP_URL: string = requireConfig(
  selectedAppUrl,
  `Missing app URL for ${APP_ENV}. Set EXPO_PUBLIC_APP_URL (or EXPO_PUBLIC_APP_URL_${APP_ENV === "production" ? "PROD" : "DEV"}).`,
  "https://ci-placeholder-app.example.com",
);
