const TOKEN_VERSION = "v1";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface DownloadTokenPayload {
  purchase_id: string;
  expires_at: string;
}

interface DownloadTokenPayloadLike {
  purchase_id?: unknown;
  purchaseId?: unknown;
  expires_at?: unknown;
  expiresAt?: unknown;
}

export function createDownloadTokenPayload(
  purchaseId: string,
  expiresAt: string | Date
): DownloadTokenPayload {
  const normalizedExpiresAt =
    expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt;

  return {
    purchase_id: ensureString(purchaseId, "purchaseId"),
    expires_at: ensureString(normalizedExpiresAt, "expiresAt")
  };
}

export async function signDownloadToken(
  payload: DownloadTokenPayload,
  secret: string
): Promise<string> {
  const normalizedSecret = ensureSecret(secret);
  const normalizedPayload = normalizePayload(payload);
  const payloadBase64 = base64UrlEncode(encoder.encode(JSON.stringify(normalizedPayload)));
  const signature = await signValue(payloadBase64, normalizedSecret);
  return `${TOKEN_VERSION}.${payloadBase64}.${signature}`;
}

export async function verifyDownloadToken(
  token: string,
  secret: string,
  now: Date = new Date()
): Promise<DownloadTokenPayload> {
  const normalizedSecret = ensureSecret(secret);
  const { payloadBase64, signature } = parseToken(token);
  const isValid = await verifyValue(payloadBase64, signature, normalizedSecret);

  if (!isValid) {
    throw new Error("Invalid download token signature");
  }

  const payloadJson = decoder.decode(base64UrlDecode(payloadBase64));
  const parsedPayload = normalizePayload(JSON.parse(payloadJson) as unknown);
  const expiresAtMs = Date.parse(parsedPayload.expires_at);

  if (Number.isNaN(expiresAtMs) || expiresAtMs <= now.getTime()) {
    throw new Error("Download token has expired");
  }

  return parsedPayload;
}

function parseToken(token: string): { payloadBase64: string; signature: string } {
  const [version, payloadBase64, signature] = token.split(".");
  if (version !== TOKEN_VERSION || !payloadBase64 || !signature) {
    throw new Error("Invalid download token format");
  }

  return { payloadBase64, signature };
}

function normalizePayload(payload: unknown): DownloadTokenPayload {
  const node = ensureObject(payload, "downloadTokenPayload") as DownloadTokenPayloadLike;

  return {
    purchase_id: ensureString(
      node.purchase_id ?? node.purchaseId,
      "downloadTokenPayload.purchase_id"
    ),
    expires_at: ensureString(
      node.expires_at ?? node.expiresAt,
      "downloadTokenPayload.expires_at"
    )
  };
}

function ensureObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }

  return value as Record<string, unknown>;
}

function ensureString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }

  return value;
}

function ensureSecret(secret: string): string {
  if (typeof secret !== "string" || secret.trim().length === 0) {
    throw new Error("Download token secret is required");
  }

  return secret;
}

async function signValue(value: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verifyValue(
  value: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await importHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    toArrayBuffer(base64UrlDecode(signature)),
    encoder.encode(value)
  );
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(value: Uint8Array): string {
  return toBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return fromBase64(normalized + "=".repeat(paddingLength));
}

function toBase64(value: Uint8Array): string {
  let raw = "";
  value.forEach((byte) => {
    raw += String.fromCharCode(byte);
  });
  return btoa(raw);
}

function fromBase64(value: string): Uint8Array {
  const raw = atob(value);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(
    value.byteOffset,
    value.byteOffset + value.byteLength
  ) as ArrayBuffer;
}
