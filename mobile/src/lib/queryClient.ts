import { QueryClient, QueryFunction } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { getStorage, setStorage } from "./utils";

// Error types
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ServerError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ServerError";
  }
}

// Check network connectivity
async function checkConnectivity() {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new NetworkError("No internet connection");
  }
}

// Cache management
const CACHE_PREFIX = "@app_cache_";
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

async function getCachedData<T>(key: string): Promise<T | null> {
  const cached = await getStorage(CACHE_PREFIX + key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
    await setStorage(CACHE_PREFIX + key, null);
    return null;
  }

  return cached.data;
}

async function setCachedData<T>(key: string, data: T): Promise<void> {
  await setStorage(CACHE_PREFIX + key, {
    data,
    timestamp: Date.now(),
  });
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new ServerError(`${res.status}: ${text}`, res.status);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  await checkConnectivity();

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  cacheKey?: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, cacheKey }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;

    // Try to get cached data first
    if (cacheKey) {
      const cached = await getCachedData<T>(cacheKey);
      if (cached) return cached;
    }

    try {
      await checkConnectivity();

      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();

      // Cache the response
      if (cacheKey) {
        await setCachedData(cacheKey, data);
      }

      return data;
    } catch (error) {
      if (error instanceof NetworkError) {
        // If offline, try to get cached data
        if (cacheKey) {
          const cached = await getCachedData<T>(cacheKey);
          if (cached) return cached;
        }
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        if (error instanceof NetworkError) {
          return failureCount < 3;
        }
        return false;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
