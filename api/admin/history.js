const { sql, ensureTable, formatBeijing } = require('../db');

module.exports = async function handler(req, res) {
  const { date, page = 1, size = 50 } = req.query;
  const pageNum = parseInt(page);
  const pageSize = parseInt(size);
  const offset = (pageNum - 1) * pageSize;

  try {
    await ensureTable();

    let result, countResult;

    if (date) {
      countResult = await sql`
        SELECT COUNT(*) as total FROM records
        WHERE DATE(checkin_time AT TIME ZONE 'Asia/Shanghai') = ${date}
      `;
      result = await sql`
        SELECT * FROM records
        WHERE DATE(checkin_time AT TIME ZONE 'Asia/Shanghai') = ${date}
        ORDER BY checkin_time DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } else {
      countResult = await sql`SELECT COUNT(*) as total FROM records`;
      result = await sql`
        SELECT * FROM records
        ORDER BY checkin_time DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    }

    const total = parseInt(countResult.rows[0].total);
    const data = result.rows.map(r => ({
      ...r,
      checkin_time: formatBeijing(r.checkin_time),
      checkout_time: formatBeijing(r.checkout_time)
    }));

    res.json({ ok: true, data, total, page: pageNum, size: pageSize });
  } catch (err) {
    console.error('查询历史记录失败:', err);
    res.status(500).json({ ok: false, msg: '查询失败' });
  }
};
