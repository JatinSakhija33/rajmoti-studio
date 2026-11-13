/**
 * Google People API helpers — server only.
 * Tokens never leave this module; the browser only ever sees status + counts.
 */
import { normalizePhone } from "@/lib/customer-directory";

export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/contacts.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PEOPLE_URL = "https://people.googleapis.com/v1/people/me/connections";
const PERSON_FIELDS = "names,phoneNumbers,emailAddresses,photos,metadata";

export function googleCredentials() {
  const clientId = process.env["GOOGLE_CONTACTS_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CONTACTS_CLIENT_SECRET"];
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

export function redirectUriFor(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/public/google-contacts/callback`;
}

export function authorizeUrl(state: string, redirectUri: string) {
  const { clientId } = googleCredentials();
  const p = new URLSearchParams({
    client_id: clientId ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
};

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[google-contacts] token request failed [${res.status}]: ${text}`);
    throw new Error("Google authorisation failed. Please reconnect and try again.");
  }
  return JSON.parse(text) as TokenResponse;
}

export async function exchangeCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = googleCredentials();
  return tokenRequest({
    code,
    client_id: clientId ?? "",
    client_secret: clientSecret ?? "",
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
}

export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = googleCredentials();
  return tokenRequest({
    refresh_token: refreshToken,
    client_id: clientId ?? "",
    client_secret: clientSecret ?? "",
    grant_type: "refresh_token",
  });
}

export async function fetchGoogleProfile(accessToken: string) {
  const res = await fetch(
    "https://people.googleapis.com/v1/people/me?personFields=emailAddresses,metadata",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    console.error(`[google-contacts] profile failed [${res.status}]: ${await res.text()}`);
    throw new Error("Could not read the connected Google account.");
  }
  const json = (await res.json()) as any;
  const email = json?.emailAddresses?.[0]?.value ?? null;
  const accountId =
    json?.metadata?.sources?.find((s: any) => s.type === "PROFILE")?.id ??
    String(json?.resourceName ?? "").replace("people/", "");
  return { email, accountId: accountId || email || "google" };
}

export type GooglePerson = {
  resourceName: string;
  etag: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  photo: string | null;
  deleted: boolean;
};

function mapPerson(p: any): GooglePerson {
  const deleted = Boolean(p?.metadata?.deleted);
  const phones: any[] = p?.phoneNumbers ?? [];
  const mobile =
    phones.find((x) => (x.type ?? "").toLowerCase() === "mobile") ?? phones[0] ?? null;
  const photo = (p?.photos ?? []).find((x: any) => !x.default)?.url ?? null;
  return {
    resourceName: p?.resourceName ?? "",
    etag: p?.etag ?? null,
    name: p?.names?.[0]?.displayName ?? null,
    phone: mobile?.canonicalForm ?? mobile?.value ?? null,
    email: p?.emailAddresses?.[0]?.value ?? null,
    photo,
    deleted,
  };
}

/** Full or incremental paginated read of the owner's connections. */
export async function listConnections(accessToken: string, syncToken?: string | null) {
  const people: GooglePerson[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;
  let expiredSyncToken = false;

  do {
    const params = new URLSearchParams({
      personFields: PERSON_FIELDS,
      pageSize: "1000",
      requestSyncToken: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    if (syncToken) params.set("syncToken", syncToken);

    const res = await fetch(`${PEOPLE_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 400 && syncToken) {
      // Expired / invalid sync token → caller falls back to a full sync.
      expiredSyncToken = true;
      break;
    }
    if (!res.ok) {
      console.error(`[google-contacts] connections failed [${res.status}]: ${await res.text()}`);
      throw new Error("Google Contacts could not be read. Please reconnect and try again.");
    }

    const json = (await res.json()) as any;
    for (const c of json?.connections ?? []) people.push(mapPerson(c));
    pageToken = json?.nextPageToken;
    nextSyncToken = json?.nextSyncToken ?? nextSyncToken;
  } while (pageToken);

  return { people, nextSyncToken, expiredSyncToken };
}

export function normalizedOrNull(raw?: string | null) {
  const n = normalizePhone(raw);
  return n.ok ? n.digits : null;
}
