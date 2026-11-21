// Shared helpers for the Razorpay functions. Server-side only:
// RAZORPAY_KEY_SECRET must never be sent to the browser.
const crypto = require('crypto');

const FEE_PAISE = 85000; // ₹850 event-service fee, fixed on the server (never trust the browser amount)
const CURRENCY = 'INR';
const API = 'https://api.razorpay.com/v1';

const CATEGORY_CODES = { models: 'MOD', designers: 'DES', creators: 'PHV', beauty: 'BTY' };
const CATEGORY_NAMES = { models: 'Models', designers: 'Fashion Designer', creators: 'Photographer / Videographer', beauty: 'Beautician' };

function keys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw Object.assign(new Error('Payment is not configured yet.'), { status: 503 });
  return { keyId, keySecret };
}

async function razorpay(path, { method = 'GET', body } = {}) {
  const { keyId, keySecret } = keys();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Razorpay API error', res.status, data && data.error);
    throw Object.assign(new Error('The payment service could not be reached. Please try again.'), { status: 502 });
  }
  return data;
}

// Unambiguous characters only (no 0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function registrationId(category) {
  const bytes = crypto.randomBytes(7);
  let code = '';
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `BNB27-${CATEGORY_CODES[category] || 'GEN'}-${code}`;
}

function validSignature(orderId, paymentId, signature) {
  const { keySecret } = keys();
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const clip = (v, n = 250) => String(v == null ? '' : v).trim().slice(0, n);

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

module.exports = { FEE_PAISE, CURRENCY, CATEGORY_NAMES, keys, razorpay, registrationId, validSignature, clip, json };
