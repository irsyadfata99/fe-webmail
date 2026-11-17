// Single HTTP client for all backend calls.
// - Cookie sesi dikirim otomatis (credentials: "include").
// - Token CSRF dibaca dari cookie `csrf_token` dan dikirim lewat header X-CSRF-Token
//   pada method yang mengubah data.
// - Semua error backend dibungkus jadi ApiError (status, code, message).

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues?: { path: string; message: string }[];

  constructor(
    status: number,
    code: string,
    message: string,
    issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return undefined;
  const value = match.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

// URL absolut ke backend (untuk tautan unduhan, dll.).
export function apiUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  return buildUrl(path, query);
}

// Event ringan supaya UI bisa bereaksi saat sesi berakhir di tengah jalan.
export const AUTH_EXPIRED_EVENT = "auth:expired";

async function request<T>(
  method: Method,
  path: string,
  { body, query, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  // FormData: browser sets the multipart Content-Type (with boundary) itself.
  if (body !== undefined && !isForm)
    headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const csrf = readCookie("csrf_token");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      credentials: "include",
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the server");
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data: unknown = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const err = (
      data as {
        error?: {
          code?: string;
          message?: string;
          issues?: ApiError["issues"];
        };
      } | null
    )?.error;
    const apiError = new ApiError(
      res.status,
      err?.code ?? "UNKNOWN_ERROR",
      err?.message ?? `Request failed (HTTP ${res.status})`,
      err?.issues,
    );
    if (res.status === 401 && apiError.code === "UNAUTHORIZED") {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw apiError;
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, opts),
};
