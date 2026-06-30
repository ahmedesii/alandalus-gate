// /api/open-gate.js
// Vercel serverless function — talks to Tuya Cloud API on the server side.
// Secrets (CLIENT_ID, CLIENT_SECRET) stay here, never sent to the browser.

const crypto = require('crypto');

// ====== CONFIG (read from Vercel Environment Variables) ======
const CLIENT_ID = process.env.TUYA_CLIENT_ID;
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const DEVICE_ID = process.env.TUYA_DEVICE_ID;
const ACCESS_CODE = process.env.GATE_ACCESS_CODE; // shared password for students
const BASE_URL = 'https://openapi.tuyaeu.com'; // Central Europe data center

function hmacSha256(message, secret) {
  return crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex').toUpperCase();
}

function sha256(message) {
  return crypto.createHash('sha256').update(message, 'utf8').digest('hex');
}

// Step 1: get a Tuya access token
async function getToken() {
  const t = Date.now().toString();
  const method = 'GET';
  const path = '/v1.0/token?grant_type=1';
  const contentHash = sha256('');
  const stringToSign = [method, contentHash, '', path].join('\n');
  const signStr = CLIENT_ID + t + stringToSign;
  const sign = hmacSha256(signStr, CLIENT_SECRET);

  const res = await fetch(BASE_URL + path, {
    method: 'GET',
    headers: {
      'client_id': CLIENT_ID,
      't': t,
      'sign_method': 'HMAC-SHA256',
      'sign': sign,
    },
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error('Failed to get Tuya token: ' + JSON.stringify(data));
  }
  return data.result.access_token;
}

// Step 2: send command to open the gate (turn relay ON)
async function openGate(accessToken) {
  const t = Date.now().toString();
  const method = 'POST';
  const path = `/v1.0/devices/${DEVICE_ID}/commands`;
  const body = JSON.stringify({
    commands: [{ code: 'switch_1', value: true }],
  });
  const contentHash = sha256(body);
  const stringToSign = [method, contentHash, '', path].join('\n');
  const signStr = CLIENT_ID + accessToken + t + stringToSign;
  const sign = hmacSha256(signStr, CLIENT_SECRET);

  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: {
      'client_id': CLIENT_ID,
      'access_token': accessToken,
      't': t,
      'sign_method': 'HMAC-SHA256',
      'sign': sign,
      'Content-Type': 'application/json',
    },
    body,
  });
  return res.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const { code } = req.body || {};

    if (!code || code !== ACCESS_CODE) {
      res.status(401).json({ success: false, message: 'Incorrect code. Try again.' });
      return;
    }

    const token = await getToken();
    const result = await openGate(token);

    if (result.success) {
      res.status(200).json({ success: true, message: 'Gate opened.' });
    } else {
      console.error('Tuya command failed:', result);
      res.status(502).json({ success: false, message: 'Could not reach the gate device.' });
    }
  } catch (err) {
    console.error('open-gate error:', err);
    res.status(500).json({ success: false, message: 'Server error. Try again.' });
  }
};
