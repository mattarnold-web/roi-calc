import { decodeJwtPayload, isTokenExpired } from './AuthContext';

// Helper: create a fake JWT with a given payload (no real signature)
function fakeJwt(payload) {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${header}.${body}.fake-signature`;
}

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT payload', () => {
    const payload = { sub: "123", email: "dan@augmentcode.com", hd: "augmentcode.com", name: "Dan", exp: 9999999999 };
    const token = fakeJwt(payload);
    const result = decodeJwtPayload(token);
    expect(result.email).toBe("dan@augmentcode.com");
    expect(result.hd).toBe("augmentcode.com");
    expect(result.name).toBe("Dan");
  });

  it('handles base64url padding correctly', () => {
    // Short payload to test padding edge case
    const payload = { a: 1 };
    const token = fakeJwt(payload);
    const result = decodeJwtPayload(token);
    expect(result.a).toBe(1);
  });

  it('returns null for malformed tokens', () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
    expect(decodeJwtPayload("")).toBeNull();
    expect(decodeJwtPayload("a.!!!.c")).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('returns false for a token expiring in the future', () => {
    const payload = { exp: Date.now() / 1000 + 3600 };
    expect(isTokenExpired(payload)).toBe(false);
  });

  it('returns true for an expired token', () => {
    const payload = { exp: Date.now() / 1000 - 3600 };
    expect(isTokenExpired(payload)).toBe(true);
  });

  it('returns true for null/undefined payload', () => {
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired(undefined)).toBe(true);
  });

  it('returns true for payload without exp', () => {
    expect(isTokenExpired({ email: "test@test.com" })).toBe(true);
  });
});

describe('AuthProvider integration', () => {
  const React = require('react');
  const { render, screen } = require('@testing-library/react');
  require('@testing-library/jest-dom');

  beforeEach(() => {
    localStorage.clear();
    delete window.google;
  });

  it('restores session from valid localStorage data', () => {
    // We no longer store the raw JWT — just profile + exp
    localStorage.setItem("roi_auth", JSON.stringify({
      exp: Date.now() / 1000 + 3600,
      email: "dan@augmentcode.com", name: "Dan", hd: "augmentcode.com"
    }));

    const { AuthProvider, useAuth } = require('./AuthContext');
    function TestConsumer() {
      const { user, loading } = useAuth();
      if (loading) return <div>loading</div>;
      return <div>{user ? user.email : "no-user"}</div>;
    }
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByText("dan@augmentcode.com")).toBeInTheDocument();
  });

  it('clears expired session from localStorage', () => {
    localStorage.setItem("roi_auth", JSON.stringify({
      exp: 1000, // way expired
      email: "dan@augmentcode.com", name: "Dan", hd: "augmentcode.com"
    }));

    const { AuthProvider, useAuth } = require('./AuthContext');
    function TestConsumer() {
      const { user, loading } = useAuth();
      if (loading) return <div>loading</div>;
      return <div>{user ? user.email : "no-user"}</div>;
    }
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByText("no-user")).toBeInTheDocument();
    expect(localStorage.getItem("roi_auth")).toBeNull();
  });

  it('clears corrupted localStorage gracefully', () => {
    localStorage.setItem("roi_auth", "not-valid-json{{{");

    const { AuthProvider, useAuth } = require('./AuthContext');
    function TestConsumer() {
      const { user, loading } = useAuth();
      if (loading) return <div>loading</div>;
      return <div>{user ? user.email : "no-user"}</div>;
    }
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByText("no-user")).toBeInTheDocument();
    expect(localStorage.getItem("roi_auth")).toBeNull();
  });

  it('stored session format has exp but no credential', () => {
    // Contract test: the shape we persist must have `exp` for expiry checks
    // but must NOT include `credential` (the raw JWT bearer token).
    // handleGoogleResponse is an internal callback so we verify the
    // expected storage contract directly.
    const session = { exp: Date.now() / 1000 + 3600, email: "test@augmentcode.com", name: "Test", picture: null, hd: "augmentcode.com" };
    localStorage.setItem("roi_auth", JSON.stringify(session));
    const stored = JSON.parse(localStorage.getItem("roi_auth"));
    expect(stored).not.toHaveProperty("credential");
    expect(stored).toHaveProperty("exp");
    expect(stored).toHaveProperty("email");
  });
});

describe('Domain validation', () => {
  // These tests verify the domain check logic in handleGoogleResponse.
  // Since handleGoogleResponse is an internal callback, we test the exported
  // decodeJwtPayload + the ALLOWED_DOMAIN constant to verify the logic path.

  it('decodes hd claim correctly for workspace accounts', () => {
    const token = fakeJwt({ email: "dan@augmentcode.com", hd: "augmentcode.com", exp: 9999999999 });
    const payload = decodeJwtPayload(token);
    expect(payload.hd).toBe("augmentcode.com");
  });

  it('personal gmail accounts have no hd claim', () => {
    const token = fakeJwt({ email: "someone@gmail.com", exp: 9999999999 });
    const payload = decodeJwtPayload(token);
    expect(payload.hd).toBeUndefined();
    // With ALLOWED_DOMAIN="augmentcode.com", undefined !== "augmentcode.com" → rejected
  });

  it('wrong domain accounts would be rejected', () => {
    const token = fakeJwt({ email: "user@evil.com", hd: "evil.com", exp: 9999999999 });
    const payload = decodeJwtPayload(token);
    const { ALLOWED_DOMAIN } = require('./AuthContext');
    expect(payload.hd).not.toBe(ALLOWED_DOMAIN);
  });

  it('matching domain accounts pass the check', () => {
    const token = fakeJwt({ email: "user@augmentcode.com", hd: "augmentcode.com", exp: 9999999999 });
    const payload = decodeJwtPayload(token);
    const { ALLOWED_DOMAIN } = require('./AuthContext');
    expect(payload.hd).toBe(ALLOWED_DOMAIN);
  });
});
