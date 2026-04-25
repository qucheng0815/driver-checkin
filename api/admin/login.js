const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, msg: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    res.json({ ok: true, msg: '登录成功' });
  } else {
    res.status(401).json({ ok: false, msg: '密码错误' });
  }
};
