const { sql, ensureTable } = require('./db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, msg: 'Method not allowed' });
  }

  const { id } = req.body || {};

  if (!id) {
    return res.status(400).json({ ok: false, msg: '请选择要签退的记录' });
  }

  try {
    await ensureTable();
    const check = await sql`
      SELECT id FROM records WHERE id = ${id} AND checkout_time IS NULL
    `;
    if (check.rows.length === 0) {
      return res.status(404).json({ ok: false, msg: '未找到该签到记录或已签退' });
    }

    await sql`UPDATE records SET checkout_time = NOW() WHERE id = ${id}`;
    res.json({ ok: true, msg: '签退成功' });
  } catch (err) {
    console.error('签退失败:', err);
    res.status(500).json({ ok: false, msg: '签退失败，请重试' });
  }
};
