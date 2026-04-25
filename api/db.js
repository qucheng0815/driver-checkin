const { sql } = require('@vercel/postgres');

// 初始化表（首次调用时自动创建）
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS records (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      plate TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT NOT NULL,
      checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checkout_time TIMESTAMPTZ DEFAULT NULL
    )
  `;
}

// 获取北京时间字符串
function formatBeijing(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
    .replace(/\//g, '-');
}

module.exports = { sql, ensureTable, formatBeijing };
