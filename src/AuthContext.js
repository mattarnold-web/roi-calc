import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const ALLOWED_DOMAIN = process.env.REACT_APP_ALLOWED_DOMAIN || "augmentcode.com";
const SDK_TIMEOUT_MS = 10000;

/**
 * Decode a JWT payload without verifying the signature.
 *
 * SECURITY NOTE: Client-side JWT decoding does NOT verify the token's
 * cryptographic signature. The `hd` (hosted domain) check is a UX gate,
 * not a security boundary. A motivated attacker could craft a token with
 * any `hd` value. For an internal SE tool with no sensitive data this is
 * acceptable; for anything higher-stakes, verify tokens server-side.
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isTokenExpired(payload) {
  if (!payload?.exp) return true;
  return Date.now() / 1000 > payload.exp;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from localStorage on mount.
  // We store only user profile + exp — never the raw JWT credential.
  useEffect(() => {
    const stored = localStorage.getItem("roi_auth");
    if (stored) {
      let parsed;
      try {
        parsed = JSON.parse(stored);
      } catch {
        localStorage.removeItem("roi_auth");
        setLoading(false);
        return;
      }
      if (parsed.exp && !isTokenExpired(parsed)) {
        setUser(parsed);
      } else {
        localStorage.removeItem("roi_auth");
      }
    }
    setLoading(false);
  }, []);

  const handleGoogleResponse = useCallback((response) => {
    setError(null);
    const payload = decodeJwtPayload(response.credential);
    if (!payload) {
      setError("Invalid token received from Google.");
      return;
    }
    // Domain check: the `hd` claim is only present for Google Workspace accounts.
    // Personal @gmail.com accounts have no `hd` field and will be rejected when
    // ALLOWED_DOMAIN is set. When ALLOWED_DOMAIN is empty, any Google account
    // is allowed (including personal accounts with no `hd`).
    if (ALLOWED_DOMAIN && payload.hd !== ALLOWED_DOMAIN) {
      setError(`Access restricted to ${ALLOWED_DOMAIN} accounts.`);
      return;
    }
    // Store only profile data + expiry — never the raw JWT credential,
    // which is a bearer token that could be exfiltrated via XSS.
    const userData = {
      exp: payload.exp,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      hd: payload.hd,
    };
    setUser(userData);
    localStorage.setItem("roi_auth", JSON.stringify(userData));
  }, []);

  // Initialize Google Sign-In when SDK is ready and user is not logged in
  useEffect(() => {
    if (loading || user) return;
    if (!GOOGLE_CLIENT_ID) {
      setError("REACT_APP_GOOGLE_CLIENT_ID is not configured.");
      return;
    }

    if (!window.google?.accounts?.id) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        } else if (Date.now() - startTime > SDK_TIMEOUT_MS) {
          clearInterval(interval);
          setError("Google Sign-In failed to load. Check your network or ad blocker.");
        }
      }, 100);
      return () => clearInterval(interval);
    }
    initGoogle();

    function initGoogle() {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: true,
      });
      const btn = document.getElementById("google-signin-button");
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
        });
      }
      window.google.accounts.id.prompt();
    }
  }, [loading, user, handleGoogleResponse]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("roi_auth");
    window.google?.accounts?.id?.disableAutoSelect();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Exported for testing
export { decodeJwtPayload, isTokenExpired, ALLOWED_DOMAIN };

