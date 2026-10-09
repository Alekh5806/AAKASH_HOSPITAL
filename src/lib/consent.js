/* The reader's cookie choice. The consent sheet writes it; anything that
   stores something optional reads it first, so nothing optional outlives the
   visit until the reader has said yes. */
export const CONSENT_COOKIE = "aakash_cookie_preferences";
const CONSENT_DAYS = 180;

export function readConsent() {
  if (typeof document === "undefined") return null;

  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];

  if (!value) return null;

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

export function writeConsent(preferences) {
  const expires = new Date(Date.now() + CONSENT_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(preferences))}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

export function allowsCategory(id) {
  return readConsent()?.[id] === true;
}
