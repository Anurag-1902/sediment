import { NextResponse } from "next/server";

import {
  getGoogleAuthClient,
  hasGoogleAppCredentials,
} from "@/lib/krutai-server";
import {
  createDeletedGoogleOAuthCookie,
  createSessionCookie,
  getCookie,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
} from "@/server/api/cookies";
import { getAuthRedirectUrl, getGoogleOAuthRedirectUri } from "../utils";

function clearGoogleOAuthCookies(response: NextResponse) {
  response.headers.append(
    "Set-Cookie",
    createDeletedGoogleOAuthCookie(GOOGLE_OAUTH_STATE_COOKIE)
  );
  response.headers.append(
    "Set-Cookie",
    createDeletedGoogleOAuthCookie(GOOGLE_OAUTH_VERIFIER_COOKIE)
  );
}

function redirectToSignIn(request: Request) {
  const response = NextResponse.redirect(
    getAuthRedirectUrl("/sign-in?google=failed")
  );
  clearGoogleOAuthCookies(response);
  return response;
}

function getReturnedSessionToken(url: URL) {
  return (
    url.searchParams.get("token") ??
    url.searchParams.get("sessionToken") ??
    url.searchParams.get("session_token")
  );
}

function getBetterAuthSessionToken(cookieHeader: string | null) {
  const signedToken =
    getCookie(cookieHeader, "better-auth.session_token") ??
    getCookie(cookieHeader, "__Secure-better-auth.session_token") ??
    getCookie(cookieHeader, "__Host-better-auth.session_token");

  return signedToken?.split(".")[0];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const cookieHeader = request.headers.get("cookie");
  const returnedSessionToken =
    getReturnedSessionToken(url) ?? getBetterAuthSessionToken(cookieHeader);
  const expectedState = getCookie(cookieHeader, GOOGLE_OAUTH_STATE_COOKIE);
  const codeVerifier = getCookie(cookieHeader, GOOGLE_OAUTH_VERIFIER_COOKIE);
  const usesAppOwnedGoogle = hasGoogleAppCredentials();

  if (oauthError) {
    return redirectToSignIn(request);
  }

  try {
    const auth = await getGoogleAuthClient(getGoogleOAuthRedirectUri());

    if (returnedSessionToken) {
      console.log("[google-callback] path decision:", {
        returnedSessionToken: !!returnedSessionToken,
        willUseSessionTokenPath: !!returnedSessionToken,
      });
      const session = await auth.getSession(returnedSessionToken);
      const response = NextResponse.redirect(getAuthRedirectUrl("/"));

      response.headers.append(
        "Set-Cookie",
        createSessionCookie(
          returnedSessionToken,
          session.session.expiresAt
        )
      );
      clearGoogleOAuthCookies(response);

      return response;
    }

    if (!usesAppOwnedGoogle || !code || !state || !expectedState || !codeVerifier) {
      return redirectToSignIn(request);
    }

    const result = await auth.completeGoogleOAuth({
      code,
      state,
      expectedState,
      codeVerifier,
    });
    const session = await auth.getSession(result.token);
    const response = NextResponse.redirect(getAuthRedirectUrl("/"));

    response.headers.append(
      "Set-Cookie",
      createSessionCookie(result.token, session.session.expiresAt)
    );
    clearGoogleOAuthCookies(response);

    return response;
  } catch (err) {
    console.error("[google-callback] OAuth failed:", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      hasReturnedSessionToken: !!returnedSessionToken,
      hasCode: !!code,
      hasState: !!state,
      hasExpectedState: !!expectedState,
      hasCodeVerifier: !!codeVerifier,
      usesAppOwnedGoogle,
    });
    return redirectToSignIn(request);
  }
}
