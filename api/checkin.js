const { sql, ensureTable, formatBeijing } = require('./db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, msg: 'Method not allowed' });
  }

  const { name, plate, phone, company } = req.body || {};

  if (!name || !plate || !phone || !company) {
    return res.status(400).json({ ok: false, msg: '请填写完整信息' });
  }

  const allowedCompanies = ['中通', '月祥', '自有', '货拉拉'];
  if (!allowedCompanies.includes(company)) {
    return res.status(400).json({ ok: false, msg: '运输公司选择有误' });
  }

  try {
    await ensureTable();
    const result = await sql`
      INSERT INTO records (name, plate, phone, company)
      VALUES (${name.trim()}, ${plate.trim().toUpperCase()}, ${phone.trim()}, ${company})
      RETURNING id
    `;
    res.json({ ok: true, msg: '签到成功', id: result.rows[0].id });
  } catch (err) {
    console.error('签到失败:', err);
    res.status(500).json({ ok: false, msg: '签到失败，请重试' });
  }
};
