const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return UUID_REGEX.test(String(value || '').trim());
}

function assertUuid(value, fieldName) {
  if (!isValidUuid(value)) {
    const err = new Error(`${fieldName} must be a valid UUID.`);
    err.status = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
}

function makeError(message, status = 500, code = 'INTERNAL_ERROR') {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function parseLimit(value, fallback = 20, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.floor(parsed));
}

module.exports = {
  isValidUuid,
  assertUuid,
  parseLimit,
  makeError,
};
