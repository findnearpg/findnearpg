import { test, expect } from '@playwright/test';

/**
 * Tests for the mobile (Expo) dev server running on port 8081
 */
test.describe('Mobile Dev Server', () => {
  const mobileUrl = process.env.MOBILE_SERVER_URL || 'http://localhost:8081';

  test('metro bundler is responsive', async ({ request }) => {
    const response = await request.get(mobileUrl, {
      failOnStatusCode: false,
    });

    // Metro should respond (may return various status codes)
    // Main check is that it doesn't timeout/refuse connection
    expect(response).toBeDefined();
  });

  test('status endpoint returns bundler info', async ({ request }) => {
    const response = await request.get(`${mobileUrl}/status`, {
      failOnStatusCode: false,
    });

    // Expo dev server typically has a status endpoint
    // May return 200 or redirect
    expect(response.status()).toBeLessThan(500);
  });
});
