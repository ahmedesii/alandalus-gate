// /api/login.js
const { sql, ensureTable } = require('./_db');
const { signToken, checkPassword } = require('./_auth');

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

    const cleanPhone = String(phone).trim();
    const result = await sql`SELECT password_hash FROM students WHERE phone = ${cleanPhone}`;

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'No account found for this phone number. Please sign up first.' });
      return;
    }

    const stored = result.rows[0].password_hash;
    if (!checkPassword(password, stored)) {
      res.status(401).json({ success: false, message: 'Incorrect password.' });
      return;
    }

    const token = signToken(cleanPhone);
    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Server error. Try again.' });
  }
};
