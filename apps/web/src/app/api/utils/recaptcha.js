export async function verifyRecaptchaToken({ token, action = 'default' }) {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, error: 'Missing reCAPTCHA token' };
  }

  try {
    const body = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await response.json();

    if (!data.success) {
      return { ok: false, error: 'reCAPTCHA verification failed', details: data['error-codes'] };
    }

    return {
      ok: true,
      score: data.score ?? null,
      actionMatched: action ? data.action === action : true,
    };
  } catch {
    return { ok: false, error: 'reCAPTCHA service unavailable' };
  }
}
