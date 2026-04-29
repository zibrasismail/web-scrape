import { toast } from "sonner";

interface ApiErrorBody {
  error?: string;
  code?: string;
  details?: unknown;
  stack?: string;
}

export function showApiError(err: unknown, fallback: string) {
  if (err instanceof DOMException && err.name === "AbortError") return;

  if (err instanceof ApiResponseError) {
    const parts = [err.message];
    if (err.code) parts.push(`[${err.code}]`);
    if (err.details) {
      const detailStr =
        typeof err.details === "string"
          ? err.details
          : JSON.stringify(err.details, null, 2);
      parts.push(detailStr);
    }
    toast.error(parts.join("\n"), { duration: 8000 });
    console.error("[API]", { ...err.raw, status: err.status });
    return;
  }

  toast.error(err instanceof Error ? err.message : fallback);
}

export class ApiResponseError extends Error {
  status: number;
  code: string | undefined;
  details: unknown;
  raw: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error || `Request failed (${status})`);
    this.name = "ApiResponseError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
    this.raw = body;
  }
}

export async function apiFetch<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new ApiResponseError(res.status, data);
  return data as T;
}
