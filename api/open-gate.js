// /api/open-gate.js
// Verifies the saved login token, then talks to Tuya Cloud API server-side.
const crypto = require('crypto');
const { verifyToken } = require('./_auth');

const CLIENT_ID = process.env.TUYA_CLIENT_ID;
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const DEVICE_ID = process.env.TUYA_DEVICE_ID;
const BASE_URL = 'https://openapi.tuyaeu.com'; // Central Europe data center

function hmacSha256(message, secret) {
  return crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex').toUpperCase();
}
function sha256(message) {
  return crypto.createHash('sha256').update(message, 'utf8').digest('hex');
}

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
  if (!data.success) throw new Error('Failed to get Tuya token: ' + JSON.stringify(data));
  return data.result.access_token;
}

async function openGate(accessToken) {
  const t = Date.now().toString();
  const method = 'POST';
  const path = `/v1.0/devices/${DEVICE_ID}/commands`;
  const body = JSON.stringify({ commands: [{ code: 'switch_1', value: true }] });
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
    const { token } = req.body || {};
    const phone = token ? verifyToken(token) : null;

    if (!phone) {
      res.status(401).json({ success: false, message: 'Please log in again.' });
      return;
    }

    const accessToken = await getToken();
    const result = await openGate(accessToken);

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
