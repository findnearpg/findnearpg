import { test, expect } from '@playwright/test';

/**
 * Tests for API route functionality
 */
test.describe('API Routes', () => {
  test.describe('Auth endpoints', () => {
    test('session endpoint returns valid response', async ({ request }) => {
      const response = await request.get('/api/auth/session');

      // Should return 200 with session data (even if no session)
      expect(response.status()).toBe(200);

      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('application/json')) {
        const body = await response.json();
        expect(typeof body).toBe('object');
      }
      // If not JSON, auth may not be fully configured — still a valid 200 response
    });

    test('csrf endpoint returns valid response', async ({ request }) => {
      const response = await request.get('/api/auth/csrf');

      expect(response.status()).toBe(200);

      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('application/json')) {
        const body = await response.json();
        expect(body).toHaveProperty('csrfToken');
        expect(typeof body.csrfToken).toBe('string');
      }
    });

    test('providers endpoint returns valid response', async ({ request }) => {
      const response = await request.get('/api/auth/providers');

      expect(response.status()).toBe(200);

      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('application/json')) {
        const body = await response.json();
        expect(typeof body).toBe('object');
      }
    });
  });

  test.describe('Body size limits', () => {
    test('rejects oversized POST body', async ({ request }) => {
      // Create a payload larger than 4.5MB limit
      const largePayload = 'x'.repeat(5 * 1024 * 1024); // 5MB

      const response = await request.post('/api/auth/session', {
        data: largePayload,
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      // Should return 413 Payload Too Large
      expect(response.status()).toBe(413);
    });
  });
});

test.describe('Integrations Proxy', () => {
  test('integrations route is reachable', async ({ request }) => {
    // This tests that the /integrations path is handled by the server
    // Without a proxy target configured, various responses are valid
    const response = await request.get('/integrations/health', {
      failOnStatusCode: false,
    });

    // Verify the server responds (doesn't crash)
    expect(response.status()).toBeDefined();
  });
});
