// /api/signup.js
const { sql, ensureTable } = require('./_db');
const { signToken, makePasswordHash } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    await ensureTable();
    const { phone, password } = req.body || {};

    if (!phone || !password) {
      res.status(400).json({ success: false, message: 'Phone and password are required.' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
      return;
    }

    const cleanPhone = String(phone).trim();

    const existing = await sql`SELECT id FROM students WHERE phone = ${cleanPhone}`;
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'An account with this phone number already exists. Please log in instead.' });
      return;
    }

    const stored = makePasswordHash(password);
    await sql`INSERT INTO students (phone, password_hash) VALUES (${cleanPhone}, ${stored})`;

    const token = signToken(cleanPhone);
    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ success: false, message: 'Server error. Try again.' });
  }
};
