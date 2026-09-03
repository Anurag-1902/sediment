import { NextResponse } from "next/server";

import {
  getGoogleAuthClient,
  hasGoogleAppCredentials,
} from "@/lib/krutai-server";
import {
  createDeletedGoogleOAuthCookie,
  createGoogleOAuthCookie,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
} from "@/server/api/cookies";
import { getGoogleOAuthRedirectUri } from "../utils";

export async function GET(request: Request) {
  const auth = await getGoogleAuthClient(getGoogleOAuthRedirectUri());
  const usesAppOwnedGoogle = hasGoogleAppCredentials();
  const oauth = usesAppOwnedGoogle
    ? auth.startGoogleOAuth()
    : await auth.authorizeGoogleOAuth();
  const response = NextResponse.redirect(oauth.authorizationUrl);

  if (!usesAppOwnedGoogle) {
    response.headers.append(
      "Set-Cookie",
      createDeletedGoogleOAuthCookie(GOOGLE_OAUTH_STATE_COOKIE)
    );
    response.headers.append(
      "Set-Cookie",
      createDeletedGoogleOAuthCookie(GOOGLE_OAUTH_VERIFIER_COOKIE)
    );

    return response;
  }

  if (!oauth.state || !oauth.codeVerifier) {
    throw new Error("Google OAuth state or code verifier was not generated");
  }

  response.headers.append(
    "Set-Cookie",
    createGoogleOAuthCookie(GOOGLE_OAUTH_STATE_COOKIE, oauth.state)
  );
  response.headers.append(
    "Set-Cookie",
    createGoogleOAuthCookie(
      GOOGLE_OAUTH_VERIFIER_COOKIE,
      oauth.codeVerifier
    )
  );

  return response;
}
