const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254",
]);

const PRIVATE_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
];

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^http?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function validateUrl(
  raw: string,
): { valid: true; url: string } | { valid: false; error: string } {
  try {
    const normalized = normalizeUrl(raw);
    if (!normalized) return { valid: false, error: "URL is required" };
    const parsed = new URL(normalized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "Only http and https URLs are allowed" };
    }
    const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
    if (BLOCKED_HOSTS.has(hostname.toLowerCase())) {
      return { valid: false, error: "Access to internal hosts is not allowed" };
    }
    for (const re of PRIVATE_RANGES) {
      if (re.test(hostname)) {
        return {
          valid: false,
          error: "Access to private network ranges is not allowed",
        };
      }
    }
    return { valid: true, url: parsed.href };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

export function validateUrls(
  urls: string[],
): { valid: true; urls: string[] } | { valid: false; error: string } {
  const cleaned: string[] = [];
  for (const u of urls) {
    const result = validateUrl(u);
    if (!result.valid) return { valid: false, error: `${u}: ${result.error}` };
    cleaned.push(result.url);
  }
  return { valid: true, urls: cleaned };
}
