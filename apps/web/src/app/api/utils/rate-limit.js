const buckets = new Map();

function nowMs() {
  return Date.now();
}

function getClientKey(request, namespace) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')?.[0]?.trim() || 'unknown';
  return `${namespace}:${ip}`;
}

export function checkRateLimit({ request, namespace, limit = 20, windowMs = 60_000 }) {
  const key = getClientKey(request, namespace);
  const timestamp = nowMs();
  const existing = buckets.get(key) || { count: 0, resetAt: timestamp + windowMs };

  if (timestamp > existing.resetAt) {
    const reset = { count: 1, resetAt: timestamp + windowMs };
    buckets.set(key, reset);
    return { ok: true, remaining: limit - 1, resetAt: reset.resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { ok: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

export function rateLimitExceededResponse(result) {
  return Response.json(
    {
      error: 'Too many requests',
      retryAfterMs: Math.max(0, result.resetAt - nowMs()),
    },
    { status: 429 }
  );
}
