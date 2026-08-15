import * as Linking from "expo-linking";
import * as ReactNative from "react-native";

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: process.env.EXPO_PUBLIC_DEEP_LINK_SCHEME?.trim() || "loopforge",
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Returns the configured API base URL. During local web development, the
 * Metro host may be mirrored by an API server on port 3000.
 */
export function getApiBaseUrl(): string {
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  return "";
}

export const SESSION_TOKEN_KEY = "loopforge-session-token";
export const USER_INFO_KEY = "loopforge-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

/** Build the OAuth callback URI for web or native. */
export const getRedirectUri = () => {
  if (ReactNative.Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/oauth/callback`;
  }

  return Linking.createURL("/oauth/callback", {
    scheme: env.deepLinkScheme,
  });
};

export const getLoginUrl = () => {
  if (!OAUTH_PORTAL_URL || !APP_ID) {
    throw new Error("OAuth is not configured. Set EXPO_PUBLIC_OAUTH_PORTAL_URL and EXPO_PUBLIC_APP_ID.");
  }

  const redirectUri = getRedirectUri();
  const state = encodeState(redirectUri);
  const url = new URL(`${OAUTH_PORTAL_URL.replace(/\/$/, "")}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
};

/**
 * Start OAuth in the system browser. The callback returns to the app through
 * the stable `loopforge://` scheme unless overridden by environment config.
 */
export async function startOAuthLogin(): Promise<string | null> {
  const loginUrl = getLoginUrl();

  if (ReactNative.Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
    return null;
  }

  const supported = await Linking.canOpenURL(loginUrl);
  if (!supported) {
    throw new Error("The configured OAuth URL cannot be opened on this device.");
  }

  await Linking.openURL(loginUrl);
  return null;
}
