const DEFAULT_AUTH_REDIRECT = "/dashboard";

export function normalizeAuthRedirect(value, fallback = DEFAULT_AUTH_REDIRECT) {
  if (
    typeof value !== "string"
    || !value.startsWith("/")
    || value.startsWith("//")
    || value.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(value)
  ) return fallback;
  return value;
}
