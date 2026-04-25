const fs = require('fs');
const path = require('path');

// Glitch 持久化目录是 .data/，其他平台用项目内 db/
const DATA_DIR = fs.existsSync('/app/.data') ? '/app/.data' : path.join(__dirname);
const DB_PATH = path.join(DATA_DIR, 'data.json');

// 默认数据结构
const DEFAULT_DATA = {
  records: [],
  nextId: 1
};

function loadData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('数据文件读取失败，使用默认数据:', err.message);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// 获取北京时间字符串
function getBeijingTime() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

// 获取北京时间日期部分
function getBeijingDate(timeStr) {
  return timeStr ? timeStr.substring(0, 10) : '';
}

module.exports = { loadData, saveData, getBeijingTime, getBeijingDate, DB_PATH };
