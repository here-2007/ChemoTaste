// lib/apiClient.ts

// Lightweight bounded concurrency runner (replaces external p-limit for deterministic cross-environment execution)
class ConcurrencyLimiter {
  private activeCount = 0;
  private queue: Array<() => void> = [];

  constructor(private concurrency: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.concurrency) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next?.();
      }
    }
  }
}

export const clientLimiter = new ConcurrencyLimiter(3);

export interface ProxyFetchOptions {
  db: 'flavordb' | 'recipedb';
  endpoint: string;
  params?: Record<string, string | number | boolean>;
  timeoutMs?: number;
}

export async function fetchViaProxy<T>(options: ProxyFetchOptions): Promise<T> {
  const { db, endpoint, params = {}, timeoutMs = 8000 } = options;

  return clientLimiter.run(async () => {
    const query = new URLSearchParams();
    query.set('db', db);
    query.set('endpoint', endpoint);
    for (const [k, v] of Object.entries(params)) {
      query.set(k, String(v));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`/api/proxy?${query.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? `Proxy request failed with HTTP ${res.status}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  });
}
