const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

function getConfiguredAppOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.VERCEL_URL;

  if (!configuredOrigin) {
    return undefined;
  }

  const originWithProtocol = configuredOrigin.startsWith("http")
    ? configuredOrigin
    : `https://${configuredOrigin}`;

  return originWithProtocol.replace(/\/$/, "");
}

function getRequestHeaderOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() ?? request.headers.get("host");

  if (!host) {
    return undefined;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto?.split(",")[0]?.trim() ?? "https";

  return `${protocol}://${host}`;
}

function getAppOrigin(request: Request) {
  return getConfiguredAppOrigin() ?? getRequestHeaderOrigin(request);
}

export function getGoogleOAuthRedirectUri(request: Request) {
  const origin = getAppOrigin(request);

  if (!origin) {
    throw new Error("Unable to determine Google OAuth redirect origin");
  }

  return `${origin}${GOOGLE_CALLBACK_PATH}`;
}

export function getAuthRedirectUrl(request: Request, path: string) {
  const origin = getAppOrigin(request);

  if (!origin) {
    throw new Error("Unable to determine auth redirect origin");
  }

  return new URL(path, origin);
}
