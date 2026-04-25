const fs = require('fs');
const path = require('path');

// Glitch 持久化目录是 .data/，其他环境用 db/
const DATA_DIR = process.env.GLITCH_PROJECT_NAME
  ? path.join(process.cwd(), '.data')
  : path.join(__dirname);

// 确保目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'data.json');

const DEFAULT_DATA = { records: [], nextId: 1 };

function loadData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('数据读取失败:', err.message);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getBeijingTime() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function getBeijingDate(timeStr) {
  return timeStr ? timeStr.substring(0, 10) : '';
}

module.exports = { loadData, saveData, getBeijingTime, getBeijingDate };
