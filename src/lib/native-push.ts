import crypto from "node:crypto";
import http2 from "node:http2";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

export type PushPayload = { title: string; body: string; url?: string };

// "invalid" means the token is gone for good (app uninstalled, token
// rotated) and should be deleted; "error" is anything transient.
export type NativeSendResult = "ok" | "invalid" | "error";

// ---------------------------------------------------------------------------
// Android — Firebase Cloud Messaging via a service account.
// FIREBASE_SERVICE_ACCOUNT holds the whole service-account JSON as one string.
// ---------------------------------------------------------------------------

const firebaseServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
export const fcmConfigured = Boolean(firebaseServiceAccount);

function firebaseMessaging() {
  if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(firebaseServiceAccount!)) });
  }
  return getMessaging();
}

const FCM_INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export async function sendFcm(token: string, payload: PushPayload): Promise<NativeSendResult> {
  if (!fcmConfigured) return "error";
  try {
    await firebaseMessaging().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.url ? { url: payload.url } : undefined,
      android: { priority: "high" },
    });
    return "ok";
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : undefined;
    return code && FCM_INVALID_TOKEN_CODES.has(code) ? "invalid" : "error";
  }
}

// ---------------------------------------------------------------------------
// iOS — straight to APNs over HTTP/2 with a token-based (.p8) auth key, so
// the iOS app doesn't need the Firebase SDK.
// ---------------------------------------------------------------------------

const apnsKeyId = process.env.APNS_KEY_ID;
const apnsTeamId = process.env.APNS_TEAM_ID;
// The .p8 file's contents; literal "\n" sequences (how most env UIs store
// multi-line values) are turned back into newlines.
const apnsPrivateKey = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, "\n");
const apnsBundleId = process.env.APNS_BUNDLE_ID ?? "com.c2cmarketplace.app";
// Development builds from Xcode get sandbox tokens; TestFlight and App Store
// builds get production tokens. The two don't mix.
const apnsHost =
  process.env.APNS_PRODUCTION === "true" ? "https://api.push.apple.com" : "https://api.sandbox.push.apple.com";

export const apnsConfigured = Boolean(apnsKeyId && apnsTeamId && apnsPrivateKey);

// APNs rejects provider tokens older than an hour and throttles ones
// refreshed more often than every 20 minutes — reuse for 50 minutes.
let cachedJwt: { token: string; issuedAt: number } | undefined;

function apnsJwt() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwt.issuedAt < 50 * 60) return cachedJwt.token;

  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "ES256", kid: apnsKeyId })}.${encode({ iss: apnsTeamId, iat: now })}`;
  const signature = crypto
    .sign("sha256", Buffer.from(unsigned), { key: apnsPrivateKey!, dsaEncoding: "ieee-p1363" })
    .toString("base64url");

  cachedJwt = { token: `${unsigned}.${signature}`, issuedAt: now };
  return cachedJwt.token;
}

function apnsRequest(deviceToken: string, body: object): Promise<{ status: number; reason?: string }> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(apnsHost);
    client.on("error", reject);

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${apnsJwt()}`,
      "apns-topic": apnsBundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let status = 0;
    let responseBody = "";
    req.setEncoding("utf8");
    req.on("response", (responseHeaders) => {
      status = Number(responseHeaders[":status"]);
    });
    req.on("data", (chunk: string) => {
      responseBody += chunk;
    });
    req.on("end", () => {
      client.close();
      let reason: string | undefined;
      try {
        reason = JSON.parse(responseBody).reason;
      } catch {
        // Empty body on success.
      }
      resolve({ status, reason });
    });
    req.on("error", (err) => {
      client.close();
      reject(err);
    });
    req.end(JSON.stringify(body));
  });
}

const APNS_INVALID_TOKEN_REASONS = new Set(["BadDeviceToken", "Unregistered", "DeviceTokenNotForTopic"]);

export async function sendApns(deviceToken: string, payload: PushPayload): Promise<NativeSendResult> {
  if (!apnsConfigured) return "error";
  try {
    const { status, reason } = await apnsRequest(deviceToken, {
      aps: { alert: { title: payload.title, body: payload.body }, sound: "default" },
      url: payload.url,
    });
    if (status === 200) return "ok";
    return status === 410 || (reason && APNS_INVALID_TOKEN_REASONS.has(reason)) ? "invalid" : "error";
  } catch {
    return "error";
  }
}
