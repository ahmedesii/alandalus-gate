// /api/_auth.js
const crypto = require('crypto');

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365; // 1 year — "remember me" by default

function signToken(phone) {
  const secret = process.env.SESSION_SECRET || 'fallback-secret-change-me';
  const payload = phone + '.' + Date.now();
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(payload + '.' + sig).toString('base64');
}

function verifyToken(token) {
  try {
    const secret = process.env.SESSION_SECRET || 'fallback-secret-change-me';
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split('.');
    const sig = parts.pop();
    const payload = parts.join('.');
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expectedSig) return null;

    const tsStr = parts[parts.length - 1];
    const phone = parts.slice(0, parts.length - 1).join('.');
    const age = Date.now() - Number(tsStr);
    if (age > SESSION_MAX_AGE_MS || age < 0) return null;

    return phone;
  } catch {
    return null;
  }
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function makePasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return salt + ':' + hash;
}

function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  return hashPassword(password, salt) === hash;
}

module.exports = { signToken, verifyToken, makePasswordHash, checkPassword };
