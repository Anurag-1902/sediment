const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

function getConfiguredAppOrigin() {
  const configuredOrigin = process.env.APP_URL?.trim();

  if (!configuredOrigin) {
    throw new Error(
      "APP_URL is not set. refusing to derive Google OAuth origin from request headers"
    );
  }

  const originWithProtocol = configuredOrigin.startsWith("http")
    ? configuredOrigin
    : `https://${configuredOrigin}`;

  return originWithProtocol.replace(/\/$/, "");
}

export function getGoogleOAuthRedirectUri() {
  return `${getConfiguredAppOrigin()}${GOOGLE_CALLBACK_PATH}`;
}

export function getAuthRedirectUrl(path: string) {
  return new URL(path, getConfiguredAppOrigin());
}
