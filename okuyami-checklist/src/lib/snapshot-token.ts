import { parseResultSnapshot, type ResultSnapshot } from "../domain/result-snapshot";

const TOKEN_VERSION = "v1";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function signSnapshotToken(
  snapshot: ResultSnapshot,
  secret: string
): Promise<string> {
  const normalizedSecret = ensureSecret(secret);
  const payload = base64UrlEncode(encoder.encode(JSON.stringify(snapshot)));
  const signature = await signValue(payload, normalizedSecret);
  return `${TOKEN_VERSION}.${payload}.${signature}`;
}

export async function verifySnapshotToken(
  token: string,
  secret: string
): Promise<ResultSnapshot> {
  const normalizedSecret = ensureSecret(secret);
  const { payload, signature } = parseToken(token);
  const isValid = await verifyValue(payload, signature, normalizedSecret);

  if (!isValid) {
    throw new Error("Invalid snapshot token signature");
  }

  const payloadJson = decoder.decode(base64UrlDecode(payload));
  const payloadValue = JSON.parse(payloadJson) as unknown;
  return parseResultSnapshot(payloadValue);
}

function parseToken(token: string): { payload: string; signature: string } {
  const [version, payload, signature] = token.split(".");
  if (version !== TOKEN_VERSION || !payload || !signature) {
    throw new Error("Invalid snapshot token format");
  }

  return { payload, signature };
}

function ensureSecret(secret: string): string {
  if (typeof secret !== "string" || secret.trim().length === 0) {
    throw new Error("Snapshot token secret is required");
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
  const padded = normalized + "=".repeat(paddingLength);
  return fromBase64(padded);
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
