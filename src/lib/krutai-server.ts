import { KrutAuth } from "@krutai/auth";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

type ServerConfig = {
  apiKey: string;
  serverUrl: string;
};

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function getServerConfig(): ServerConfig {
  return {
    apiKey: requireEnv("KRUTAI_API_KEY"),
    serverUrl: requireEnv("KRUTAI_SERVER_URL"),
  };
}

export function getGoogleAppCredentials() {
  const clientId = optionalEnv("GOOGLE_CLIENT_ID");
  const clientSecret = optionalEnv("GOOGLE_CLIENT_SECRET");

  if ((clientId && !clientSecret) || (!clientId && clientSecret)) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be provided together"
    );
  }

  if (!clientId || !clientSecret) {
    return undefined;
  }

  return { clientId, clientSecret };
}

export function hasGoogleAppCredentials() {
  return Boolean(getGoogleAppCredentials());
}

let authClientPromise: Promise<KrutAuth> | null = null;
const googleAuthClientPromises = new Map<string, Promise<KrutAuth>>();
let poolPromise: Promise<Pool> | null = null;
let prismaPromise: Promise<PrismaClient> | null = null;

export async function getDbUrl() {
  return requireEnv("DATABASE_URL");
}

export async function getAuthClient() {
  if (!authClientPromise) {
    authClientPromise = (async () => {
      const config = getServerConfig();
      const databaseUrl = await getDbUrl();
      const auth = new KrutAuth({
        apiKey: config.apiKey,
        serverUrl: config.serverUrl,
        databaseUrl,
      });

      await auth.initialize();
      return auth;
    })().catch((error) => {
      authClientPromise = null;
      throw error;
    });
  }

  return authClientPromise;
}

export async function getGoogleAuthClient(redirectUri: string) {
  const normalizedRedirectUri = redirectUri.trim();
  let authPromise = googleAuthClientPromises.get(normalizedRedirectUri);

  if (!authPromise) {
    authPromise = (async () => {
      const config = getServerConfig();
      const databaseUrl = await getDbUrl();
      const googleCredentials = getGoogleAppCredentials();
      const auth = new KrutAuth({
        apiKey: config.apiKey,
        serverUrl: config.serverUrl,
        databaseUrl,
        google: {
          ...googleCredentials,
          redirectUri: normalizedRedirectUri,
        },
      });

      await auth.initialize();
      return auth;
    })().catch((error) => {
      googleAuthClientPromises.delete(normalizedRedirectUri);
      throw error;
    });

    googleAuthClientPromises.set(normalizedRedirectUri, authPromise);
  }

  return authPromise;
}

export async function getPool() {
  if (!poolPromise) {
    poolPromise = (async () => {
      const dbUrl = await getDbUrl();
      const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

      return new Pool({
        connectionString: dbUrl,
        ssl: isLocal ? undefined : { rejectUnauthorized: false },
      });
    })().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
}

export async function getPrisma() {
  if (!prismaPromise) {
    prismaPromise = (async () => {
      const pool = await getPool();
      const adapter = new PrismaPg(pool);
      return new PrismaClient({ adapter });
    })().catch((error) => {
      prismaPromise = null;
      throw error;
    });
  }
  return prismaPromise;
}
