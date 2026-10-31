/**
 * Safe API Client & URL Resolver
 * Handles server-side vs browser-side base URL resolution and standard JSON fetching.
 */

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${cleanPath}`;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

export async function fetchJson<T = any>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = path.startsWith("http://") || path.startsWith("https://")
      ? path
      : getApiUrl(path);

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options?.headers || {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Request failed with status ${res.status}`,
        status: res.status,
        ...data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network request failed. Please check your connection.",
    };
  }
}

