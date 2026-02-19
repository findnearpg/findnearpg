import crypto from 'node:crypto';

function base64Encode(value) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function base64Decode(value) {
  return Buffer.from(value, 'base64').toString('utf8');
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getConfig() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  const baseUrl = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

  const enabled = Boolean(merchantId && saltKey && saltIndex && baseUrl);

  return {
    enabled,
    merchantId,
    saltKey,
    saltIndex,
    baseUrl,
  };
}

function getPayXVerify({ payloadBase64, saltKey, saltIndex }) {
  const value = sha256Hex(`${payloadBase64}/pg/v1/pay${saltKey}`);
  return `${value}###${saltIndex}`;
}

function getStatusXVerify({ merchantId, merchantTransactionId, saltKey, saltIndex }) {
  const statusPath = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const value = sha256Hex(`${statusPath}${saltKey}`);
  return `${value}###${saltIndex}`;
}

export function parseCallbackPayload(payload) {
  if (!payload) return null;

  if (payload.response) {
    try {
      const decoded = JSON.parse(base64Decode(payload.response));
      return decoded;
    } catch {
      return null;
    }
  }

  return payload;
}

export function normalizePhonePeState(rawStatus) {
  const status = String(rawStatus || '').toUpperCase();
  if (status === 'SUCCESS' || status === 'COMPLETED') {
    return { paymentStatus: 'paid', bookingStatus: 'confirmed' };
  }
  if (status === 'PENDING' || status === 'INITIATED') {
    return { paymentStatus: 'pending', bookingStatus: 'pending' };
  }
  return { paymentStatus: 'failed', bookingStatus: 'cancelled' };
}

export async function initiatePhonePePayment({
  merchantTransactionId,
  merchantUserId,
  amountPaise,
  redirectUrl,
  callbackUrl,
  mobileNumber,
}) {
  const config = getConfig();
  if (!config.enabled) {
    return {
      ok: false,
      error: 'PhonePe is not configured',
      code: 'PHONEPE_NOT_CONFIGURED',
    };
  }

  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId,
    merchantUserId,
    amount: amountPaise,
    redirectUrl,
    redirectMode: 'REDIRECT',
    callbackUrl,
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
    ...(mobileNumber ? { mobileNumber } : {}),
  };

  const payloadBase64 = base64Encode(JSON.stringify(payload));
  const xVerify = getPayXVerify({
    payloadBase64,
    saltKey: config.saltKey,
    saltIndex: config.saltIndex,
  });

  const response = await fetch(`${config.baseUrl}/pg/v1/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': xVerify,
      accept: 'application/json',
    },
    body: JSON.stringify({ request: payloadBase64 }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    return {
      ok: false,
      error: data?.message || 'Failed to initiate PhonePe payment',
      raw: data,
    };
  }

  const paymentUrl = data?.data?.instrumentResponse?.redirectInfo?.url || null;
  return {
    ok: Boolean(paymentUrl),
    paymentUrl,
    raw: data,
    error: paymentUrl ? null : 'PhonePe did not return redirect URL',
  };
}

export async function fetchPhonePeStatus(merchantTransactionId) {
  const config = getConfig();
  if (!config.enabled) {
    return {
      ok: false,
      error: 'PhonePe is not configured',
      code: 'PHONEPE_NOT_CONFIGURED',
    };
  }

  const xVerify = getStatusXVerify({
    merchantId: config.merchantId,
    merchantTransactionId,
    saltKey: config.saltKey,
    saltIndex: config.saltIndex,
  });

  const url = `${config.baseUrl}/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': xVerify,
      'X-MERCHANT-ID': config.merchantId,
      accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    return {
      ok: false,
      error: data?.message || 'Failed to fetch PhonePe status',
      raw: data,
    };
  }

  const status = data?.data?.state || data?.data?.status;
  return {
    ok: true,
    status,
    raw: data,
  };
}

export function isPhonePeConfigured() {
  return getConfig().enabled;
}
