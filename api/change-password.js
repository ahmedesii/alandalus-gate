// /api/change-password.js
// No old password required — user just provides phone + new password (forgot password flow)
const { sql, ensureTable } = require('./_db');
const { makePasswordHash } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    await ensureTable();
    const { phone, newPassword } = req.body || {};

    if (!phone || !newPassword) {
      res.status(400).json({ success: false, message: 'Phone and new password are required.' });
      return;
    }
    if (newPassword.length < 4) {
      res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
      return;
    }

    const cleanPhone = String(phone).trim();
    const result = await sql`SELECT id FROM students WHERE phone = ${cleanPhone}`;

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'No account found for this phone number.' });
      return;
    }

    const newStored = makePasswordHash(newPassword);
    await sql`UPDATE students SET password_hash = ${newStored} WHERE phone = ${cleanPhone}`;

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('change-password error:', err);
    res.status(500).json({ success: false, message: 'Server error. Try again.' });
  }
};
