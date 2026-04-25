const { sql, ensureTable, formatBeijing } = require('../db');

module.exports = async function handler(req, res) {
  try {
    await ensureTable();
    const result = await sql`
      SELECT id, name, plate, phone, company, checkin_time
      FROM records
      WHERE checkout_time IS NULL
      ORDER BY checkin_time DESC
    `;
    const data = result.rows.map(r => ({
      ...r,
      checkin_time: formatBeijing(r.checkin_time)
    }));
    res.json({ ok: true, data });
  } catch (err) {
    console.error('查询在场车辆失败:', err);
    res.status(500).json({ ok: false, msg: '查询失败' });
  }
};
