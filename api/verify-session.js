// /api/verify-session.js
const { verifyToken } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const { token } = req.body || {};
    const phone = token ? verifyToken(token) : null;

    if (!phone) {
      res.status(401).json({ success: false });
      return;
    }

    res.status(200).json({ success: true, phone });
  } catch (err) {
    console.error('verify-session error:', err);
    res.status(500).json({ success: false });
  }
};
