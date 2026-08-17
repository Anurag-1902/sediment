export const SESSION_COOKIE = "krutai_auth_session";
export const GOOGLE_OAUTH_STATE_COOKIE = "krutai_google_oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "krutai_google_oauth_verifier";

type CookieOptions = {
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  path?: string;
  maxAge?: number;
  expires?: Date;
};

export function getCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  return parts.join("; ");
}

export function createSessionCookie(token: string, expiresAt: string | Date) {
  const expiresAtTime = new Date(expiresAt).getTime();

  return serializeCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(60, Math.floor((expiresAtTime - Date.now()) / 1000)),
  });
}

export function createDeletedSessionCookie() {
  return serializeCookie(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export function createGoogleOAuthCookie(name: string, value: string) {
  return serializeCookie(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google/callback",
    maxAge: 10 * 60,
  });
}

export function createDeletedGoogleOAuthCookie(name: string) {
  return serializeCookie(name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/google/callback",
    maxAge: 0,
    expires: new Date(0),
  });
}
