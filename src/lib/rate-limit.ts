const store = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 min
const MAX_REQUESTS = 100;

export function rateLimit(identifier: string): { ok: boolean; remaining: number } {
    const now = Date.now();
    const key = identifier;
    let entry = store.get(key);

    if (!entry) {
        entry = { count: 1, resetAt: now + WINDOW_MS };
        store.set(key, entry);
        return { ok: true, remaining: MAX_REQUESTS - 1 };
    }

    if (now > entry.resetAt) {
        entry = { count: 1, resetAt: now + WINDOW_MS };
        store.set(key, entry);
        return { ok: true, remaining: MAX_REQUESTS - 1 };
    }

    entry.count++;
    if (entry.count > MAX_REQUESTS) {
        return { ok: false, remaining: 0 };
    }
    return { ok: true, remaining: MAX_REQUESTS - entry.count };
}

export function getClientIdentifier(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    return ip;
}
