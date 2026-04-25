const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'checkin.db');

function initDB() {
  const db = new Database(DB_PATH);

  // 开启 WAL 模式，提升并发读写性能
  db.pragma('journal_mode = WAL');

  // 签到记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plate TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT NOT NULL,
      checkin_time DATETIME NOT NULL DEFAULT (datetime('now', '+8 hours')),
      checkout_time DATETIME DEFAULT NULL
    )
  `);

  // 为常用查询建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_plate ON records(plate);
    CREATE INDEX IF NOT EXISTS idx_checkin_time ON records(checkin_time);
    CREATE INDEX IF NOT EXISTS idx_checkout_time ON records(checkout_time);
  `);

  return db;
}

module.exports = { initDB, DB_PATH };
