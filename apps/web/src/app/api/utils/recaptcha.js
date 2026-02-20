let enterpriseClientPromise = null;

function parseEnterpriseCredentials() {
  const raw = String(process.env.RECAPTCHA_ENTERPRISE_CREDENTIALS_JSON || '').trim();
  if (!raw) return null;
  try {
    const credentials = JSON.parse(raw);
    if (credentials.private_key) {
      credentials.private_key = String(credentials.private_key).replace(/\\n/g, '\n');
    }
    return credentials;
  } catch {
    return null;
  }
}

async function getEnterpriseClient() {
  if (!enterpriseClientPromise) {
    enterpriseClientPromise = (async () => {
      const module = await import('@google-cloud/recaptcha-enterprise');
      const RecaptchaEnterpriseServiceClient = module.RecaptchaEnterpriseServiceClient;
      const credentials = parseEnterpriseCredentials();
      return credentials
        ? new RecaptchaEnterpriseServiceClient({ credentials })
        : new RecaptchaEnterpriseServiceClient();
    })();
  }
  return enterpriseClientPromise;
}

async function verifyEnterpriseRecaptchaToken({ token, action = 'default' }) {
  const projectId = String(process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID || '').trim();
  const siteKey = String(
    process.env.RECAPTCHA_ENTERPRISE_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
  ).trim();
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || 0.3);

  if (!projectId || !siteKey) {
    return { ok: false, error: 'Enterprise reCAPTCHA is not fully configured' };
  }
  if (!token) {
    return { ok: false, error: 'Missing reCAPTCHA token' };
  }

  try {
    const client = await getEnterpriseClient();
    const parent = client.projectPath(projectId);
    const [response] = await client.createAssessment({
      parent,
      assessment: {
        event: {
          token,
          siteKey,
          expectedAction: action,
        },
      },
    });

    if (!response?.tokenProperties?.valid) {
      return {
        ok: false,
        error: 'reCAPTCHA verification failed',
        details: [String(response?.tokenProperties?.invalidReason || 'INVALID_TOKEN')],
      };
    }

    const actionMatched = !action || response.tokenProperties.action === action;
    if (!actionMatched) {
      return { ok: false, error: 'reCAPTCHA action mismatch' };
    }

    const score = Number(response?.riskAnalysis?.score ?? 0);
    if (Number.isFinite(minScore) && score < minScore) {
      return {
        ok: false,
        error: 'reCAPTCHA score too low',
        score,
        details: response?.riskAnalysis?.reasons || [],
      };
    }

    return {
      ok: true,
      score,
      actionMatched,
      details: response?.riskAnalysis?.reasons || [],
    };
  } catch (error) {
    console.error('Enterprise reCAPTCHA verification failed:', error);
    return { ok: false, error: 'reCAPTCHA service unavailable' };
  }
}

async function verifyClassicRecaptchaToken({ token, action = 'default' }) {
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

export async function verifyRecaptchaToken({ token, action = 'default' }) {
  const enterpriseEnabled = String(process.env.RECAPTCHA_PROVIDER || '')
    .trim()
    .toLowerCase() === 'enterprise'
    || Boolean(process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID);

  if (enterpriseEnabled) {
    return verifyEnterpriseRecaptchaToken({ token, action });
  }
  return verifyClassicRecaptchaToken({ token, action });
}
