const express = require('express');
const router = express.Router();
const { saveDB, getBeijingTime } = require('../db/init');

// 管理员密码
const ADMIN_PASSWORD = 'admin123';

// sql.js 查询辅助：将结果转为对象数组
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = function (db) {

  // ========== 签到 ==========
  router.post('/checkin', (req, res) => {
    const { name, plate, phone, company } = req.body;

    if (!name || !plate || !phone || !company) {
      return res.status(400).json({ ok: false, msg: '请填写完整信息' });
    }

    const allowedCompanies = ['中通', '月祥', '自有', '货拉拉'];
    if (!allowedCompanies.includes(company)) {
      return res.status(400).json({ ok: false, msg: '运输公司选择有误' });
    }

    try {
      const now = getBeijingTime();
      db.run(
        'INSERT INTO records (name, plate, phone, company, checkin_time) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), plate.trim().toUpperCase(), phone.trim(), company, now]
      );
      saveDB();

      const last = queryOne(db, 'SELECT last_insert_rowid() as id');
      res.json({ ok: true, msg: '签到成功', id: last ? last.id : null });
    } catch (err) {
      console.error('签到失败:', err);
      res.status(500).json({ ok: false, msg: '签到失败，请重试' });
    }
  });

  // ========== 获取待签退车辆列表（已签到未签退） ==========
  router.get('/pending', (req, res) => {
    try {
      const rows = queryAll(db,
        'SELECT id, name, plate, phone, company, checkin_time FROM records WHERE checkout_time IS NULL ORDER BY checkin_time DESC'
      );
      res.json({ ok: true, data: rows });
    } catch (err) {
      console.error('查询待签退失败:', err);
      res.status(500).json({ ok: false, msg: '查询失败' });
    }
  });

  // ========== 签退 ==========
  router.post('/checkout', (req, res) => {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, msg: '请选择要签退的记录' });
    }

    try {
      const record = queryOne(db, 'SELECT * FROM records WHERE id = ? AND checkout_time IS NULL', [id]);
      if (!record) {
        return res.status(404).json({ ok: false, msg: '未找到该签到记录或已签退' });
      }

      const now = getBeijingTime();
      db.run('UPDATE records SET checkout_time = ? WHERE id = ?', [now, id]);
      saveDB();
      res.json({ ok: true, msg: '签退成功' });
    } catch (err) {
      console.error('签退失败:', err);
      res.status(500).json({ ok: false, msg: '签退失败，请重试' });
    }
  });

  // ========== 管理员登录 ==========
  router.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ ok: true, msg: '登录成功' });
    } else {
      res.status(401).json({ ok: false, msg: '密码错误' });
    }
  });

  // ========== 管理后台 - 当前在场车辆 ==========
  router.get('/admin/current', (req, res) => {
    try {
      const rows = queryAll(db,
        'SELECT id, name, plate, phone, company, checkin_time FROM records WHERE checkout_time IS NULL ORDER BY checkin_time DESC'
      );
      res.json({ ok: true, data: rows });
    } catch (err) {
      console.error('查询在场车辆失败:', err);
      res.status(500).json({ ok: false, msg: '查询失败' });
    }
  });

  // ========== 管理后台 - 历史记录（按日期筛选） ==========
  router.get('/admin/history', (req, res) => {
    const { date, page = 1, size = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(size);

    try {
      let where = '1=1';
      const params = [];

      if (date) {
        where += " AND DATE(checkin_time) = ?";
        params.push(date);
      }

      const countRow = queryOne(db, `SELECT COUNT(*) as total FROM records WHERE ${where}`, params);
      const total = countRow ? countRow.total : 0;

      const rows = queryAll(db,
        `SELECT * FROM records WHERE ${where} ORDER BY checkin_time DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(size), offset]
      );

      res.json({
        ok: true,
        data: rows,
        total: total,
        page: parseInt(page),
        size: parseInt(size)
      });
    } catch (err) {
      console.error('查询历史记录失败:', err);
      res.status(500).json({ ok: false, msg: '查询失败' });
    }
  });

  return router;
};
