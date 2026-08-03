import crypto from "node:crypto";

export interface TelegramInitDataUser {
  id: number;
  first_name?: string;
  username?: string;
}

export interface ParsedInitData {
  user?: TelegramInitDataUser;
  authDate?: number;
  hash?: string;
}

/**
 * Валидация initData из Telegram Mini App по официальной схеме:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string, botToken: string, maxAgeSeconds = 86400): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");

  const pairs = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  const dataCheckString = pairs.join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return false;

  const authDate = Number(params.get("auth_date"));
  if (Number.isFinite(authDate)) {
    const ageSeconds = Date.now() / 1000 - authDate;
    if (ageSeconds > maxAgeSeconds) return false;
  }

  return true;
}

export function parseInitData(initData: string): ParsedInitData {
  const params = new URLSearchParams(initData);
  const userRaw = params.get("user");
  const user = userRaw ? (JSON.parse(userRaw) as TelegramInitDataUser) : undefined;
  const authDate = params.get("auth_date") ? Number(params.get("auth_date")) : undefined;
  const hash = params.get("hash") ?? undefined;
  return { user, authDate, hash };
}
