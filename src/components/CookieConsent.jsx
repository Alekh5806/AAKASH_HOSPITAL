import { useEffect, useState } from "react";

const COOKIE_NAME = "aakash_cookie_preferences";
const COOKIE_DAYS = 180;
const defaultPreferences = {
  necessary: true,
  experience: true,
  analytics: false,
};
const allPreferences = {
  necessary: true,
  experience: true,
  analytics: true,
};

function readCookie() {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

function writeCookie(preferences) {
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(preferences))}; expires=${expires}; path=/; SameSite=Lax`;
}

function getInitialCookieState() {
  const savedPreferences = readCookie();

  if (!savedPreferences) {
    return {
      isVisible: true,
      preferences: defaultPreferences,
    };
  }

  return {
    isVisible: false,
    preferences: { ...defaultPreferences, ...savedPreferences, necessary: true },
  };
}

export default function CookieConsent() {
  const initialState = useState(getInitialCookieState)[0];
  const [isVisible, setIsVisible] = useState(initialState.isVisible);
  const [isEditing, setIsEditing] = useState(false);
  const [preferences, setPreferences] = useState(initialState.preferences);

  useEffect(() => {
    function openPreferences() {
      const savedPreferences = readCookie();

      if (savedPreferences) {
        setPreferences({ ...defaultPreferences, ...savedPreferences, necessary: true });
      }

      setIsEditing(true);
      setIsVisible(true);
    }

    window.addEventListener("aakash:open-cookie-preferences", openPreferences);
    return () => window.removeEventListener("aakash:open-cookie-preferences", openPreferences);
  }, []);

  function savePreferences(nextPreferences) {
    const normalizedPreferences = { ...nextPreferences, necessary: true };
    writeCookie(normalizedPreferences);
    setPreferences(normalizedPreferences);
    setIsVisible(false);
    setIsEditing(false);
  }

  function togglePreference(key) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: !currentPreferences[key],
    }));
  }

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="cookie-consent" aria-labelledby="cookie-consent-title">
      <div className="cookie-consent__copy">
        <span>Privacy Preferences</span>
        <h2 id="cookie-consent-title">A smoother visit with respectful cookies.</h2>
        <p>
          We use essential cookies to save this choice. Optional cookies can help remember website
          preferences and understand general site usage.
        </p>
      </div>

      {isEditing ? (
        <div className="cookie-consent__settings" aria-label="Cookie preference settings">
          <label>
            <input type="checkbox" checked readOnly />
            <span>
              Necessary
              <small>Required for privacy choices and core website functions.</small>
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.experience}
              onChange={() => togglePreference("experience")}
            />
            <span>
              Experience
              <small>Remembers helpful website preferences for future visits.</small>
            </span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={() => togglePreference("analytics")}
            />
            <span>
              Analytics
              <small>Allows privacy-friendly measurement if analytics are added.</small>
            </span>
          </label>
        </div>
      ) : null}

      <div className="cookie-consent__actions">
        {isEditing ? (
          <button
            type="button"
            className="cookie-consent__primary"
            onClick={() => savePreferences(preferences)}
          >
            Save Preferences
          </button>
        ) : (
          <button
            type="button"
            className="cookie-consent__primary"
            onClick={() => savePreferences(allPreferences)}
          >
            Accept All
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            savePreferences({ ...defaultPreferences, experience: false, analytics: false })
          }
        >
          Reject Optional
        </button>
        <button
          type="button"
          onClick={() => (isEditing ? savePreferences(allPreferences) : setIsEditing(true))}
        >
          {isEditing ? "Accept All" : "Customize"}
        </button>
      </div>
    </aside>
  );
}
