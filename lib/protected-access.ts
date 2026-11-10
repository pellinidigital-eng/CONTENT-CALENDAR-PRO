export const ACCESS_COOKIE_NAME = "pd_calendar_tool_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 6;

const EXPECTED_PRODUCT_ID = 147;
const CLOCK_SKEW_SECONDS = 60;
const MAX_TOKEN_AGE_SECONDS = 10 * 60;

type JwtHeader = {
  alg?: unknown;
  kid?: unknown;
  typ?: unknown;
};

type TokenPayload = {
  iss?: unknown;
  aud?: unknown;
  tool_id?: unknown;
  sub?: unknown;
  edd_product_id?: unknown;
  iat?: unknown;
  exp?: unknown;
  jti?: unknown;
};

type SessionPayload = {
  sub?: unknown;
  tool_id?: unknown;
  iat?: unknown;
  exp?: unknown;
};

export type VerifiedAccessToken = {
  sub: string;
  toolId: string;
  issuedAt: number;
  expiresAt: number;
};

export type AccessCheck =
  | { ok: true; value: VerifiedAccessToken }
  | { ok: false; reason: string };

function getRequiredEnv(name: string) {
  const value = process.env[name];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

function getAccessConfig() {
  const secret = getRequiredEnv("PELLINIDIGITAL_TOOL_ACCESS_SECRET");
  const keyId = getRequiredEnv("PELLINIDIGITAL_TOOL_ACCESS_KEY_ID");
  const issuer = getRequiredEnv("PELLINIDIGITAL_TOKEN_ISSUER");
  const toolId = getRequiredEnv("PELLINIDIGITAL_TOOL_ID");

  if (!secret || !keyId || !issuer || !toolId) {
    return null;
  }

  return { secret, keyId, issuer, toolId };
}

function base64urlEncode(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64urlEncodeText(value: string) {
  return base64urlEncode(new TextEncoder().encode(value));
}

function base64urlDecode(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    return null;
  }

  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");

  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  } catch {
    return null;
  }
}

function decodeJsonPart<T>(value: string) {
  const bytes = base64urlDecode(value);

  if (!bytes) {
    return null;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signInput(signingInput: string, secret: string) {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));

  return new Uint8Array(signature);
}

async function verifySignature(signingInput: string, signature: Uint8Array, secret: string) {
  const key = await importHmacKey(secret);

  return crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(signingInput));
}

function readJwtParts(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonPart<JwtHeader>(encodedHeader);
  const signature = base64urlDecode(encodedSignature);

  if (!header || !signature) {
    return null;
  }

  return {
    encodedHeader,
    encodedPayload,
    encodedSignature,
    header,
    signature,
    signingInput: `${encodedHeader}.${encodedPayload}`
  };
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isPlausibleIssuedAt(iat: number, now: number) {
  return iat <= now + CLOCK_SKEW_SECONDS && iat >= now - MAX_TOKEN_AGE_SECONDS;
}

function validateHeader(header: JwtHeader, expectedKeyId: string) {
  return header.alg === "HS256" && header.kid === expectedKeyId;
}

export async function verifyWordPressAccessToken(token: string): Promise<AccessCheck> {
  const config = getAccessConfig();

  if (!config) {
    return { ok: false, reason: "missing_env" };
  }

  const parts = readJwtParts(token);

  if (!parts || !validateHeader(parts.header, config.keyId)) {
    return { ok: false, reason: "invalid_header" };
  }

  const validSignature = await verifySignature(parts.signingInput, parts.signature, config.secret);

  if (!validSignature) {
    return { ok: false, reason: "invalid_signature" };
  }

  const payload = decodeJsonPart<TokenPayload>(parts.encodedPayload);

  if (!payload) {
    return { ok: false, reason: "invalid_payload" };
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    payload.iss !== config.issuer ||
    payload.aud !== config.toolId ||
    payload.tool_id !== config.toolId ||
    payload.edd_product_id !== EXPECTED_PRODUCT_ID ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    !isValidTimestamp(payload.iat) ||
    !isValidTimestamp(payload.exp)
  ) {
    return { ok: false, reason: "invalid_claims" };
  }

  if (payload.exp <= now || !isPlausibleIssuedAt(payload.iat, now) || payload.exp <= payload.iat) {
    return { ok: false, reason: "expired_or_implausible" };
  }

  return {
    ok: true,
    value: {
      sub: payload.sub,
      toolId: config.toolId,
      issuedAt: payload.iat,
      expiresAt: payload.exp
    }
  };
}

export async function createSessionCookieValue(access: VerifiedAccessToken) {
  const config = getAccessConfig();

  if (!config || access.toolId !== config.toolId) {
    return "";
  }

  const now = Math.floor(Date.now() / 1000);
  const header = {
    typ: "JWT",
    alg: "HS256",
    kid: config.keyId
  };
  const payload = {
    sub: access.sub,
    tool_id: config.toolId,
    iat: now,
    exp: now + SESSION_TTL_SECONDS
  };

  const encodedHeader = base64urlEncodeText(JSON.stringify(header));
  const encodedPayload = base64urlEncodeText(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signInput(signingInput, config.secret);

  return `${signingInput}.${base64urlEncode(signature)}`;
}

export async function verifySessionCookie(cookieValue: string): Promise<AccessCheck> {
  const config = getAccessConfig();

  if (!config) {
    return { ok: false, reason: "missing_env" };
  }

  const parts = readJwtParts(cookieValue);

  if (!parts || !validateHeader(parts.header, config.keyId)) {
    return { ok: false, reason: "invalid_header" };
  }

  const validSignature = await verifySignature(parts.signingInput, parts.signature, config.secret);

  if (!validSignature) {
    return { ok: false, reason: "invalid_signature" };
  }

  const payload = decodeJsonPart<SessionPayload>(parts.encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (
    !payload ||
    payload.tool_id !== config.toolId ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    !isValidTimestamp(payload.iat) ||
    !isValidTimestamp(payload.exp)
  ) {
    return { ok: false, reason: "invalid_claims" };
  }

  if (payload.exp <= now || payload.iat > now + CLOCK_SKEW_SECONDS || payload.exp <= payload.iat) {
    return { ok: false, reason: "expired_or_implausible" };
  }

  return {
    ok: true,
    value: {
      sub: payload.sub,
      toolId: config.toolId,
      issuedAt: payload.iat,
      expiresAt: payload.exp
    }
  };
}
