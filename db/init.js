const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'checkin.db');

let db = null;

// 自动持久化：每次写操作后保存到文件
function saveDB() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

async function initDB() {
  const SQL = await initSqlJs();

  // 如果已有数据库文件，加载它
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plate TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT NOT NULL,
      checkin_time TEXT NOT NULL,
      checkout_time TEXT DEFAULT NULL
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_plate ON records(plate)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_checkin_time ON records(checkin_time)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_checkout_time ON records(checkout_time)`);

  saveDB();
  return db;
}

// 获取北京时间字符串
function getBeijingTime() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);
}

module.exports = { initDB, saveDB, getBeijingTime, DB_PATH };
