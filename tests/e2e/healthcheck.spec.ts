import { test, expect } from '@playwright/test';

/**
 * Tests for the healthcheck service running on port 9000
 */
test.describe('Healthcheck Service', () => {
  const healthcheckUrl = process.env.HEALTHCHECK_URL || 'http://localhost:9000';

  test('returns health status on /healthz', async ({ request }) => {
    const response = await request.get(`${healthcheckUrl}/healthz`);

    // Should return either 200 (healthy) or 500 (unhealthy) with JSON body
    expect([200, 500]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('web');
    expect(body).toHaveProperty('mobile');
    expect(body).toHaveProperty('since');

    expect(['ok', 'unhealthy']).toContain(body.status);
    expect(['ok', 'unhealthy']).toContain(body.web);
    expect(['ok', 'unhealthy']).toContain(body.mobile);
  });

  test('returns 404 for unknown paths', async ({ request }) => {
    const response = await request.get(`${healthcheckUrl}/unknown`);
    expect(response.status()).toBe(404);
  });
});
