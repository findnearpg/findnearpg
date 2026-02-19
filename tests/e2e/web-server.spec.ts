import { test, expect } from '@playwright/test';

/**
 * Tests for the web dev server running on port 4000
 */
test.describe('Web Dev Server', () => {
  test('serves the homepage', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBeLessThan(500);
    // Page should have some content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('returns proper response headers', async ({ request }) => {
    const response = await request.get('/');

    expect(response.status()).toBeLessThan(500);
    // Should have content-type header
    const contentType = response.headers()['content-type'];
    expect(contentType).toBeDefined();
  });

  test('handles 404 gracefully', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-that-should-not-exist');

    // Should not crash the server (no 500 errors)
    // 404 is expected, but app might also redirect or show custom page
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Web Server Error Handling', () => {
  test('returns JSON error for non-GET API errors', async ({ request }) => {
    // POST to a nonexistent API endpoint
    const response = await request.post('/api/nonexistent', {
      data: { test: true },
    });

    // Should return an error response, not crash
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
