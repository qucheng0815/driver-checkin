const express = require('express');
const router = express.Router();

// 管理员密码
const ADMIN_PASSWORD = 'admin123';

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
      const stmt = db.prepare(
        'INSERT INTO records (name, plate, phone, company) VALUES (?, ?, ?, ?)'
      );
      const result = stmt.run(name.trim(), plate.trim().toUpperCase(), phone.trim(), company);
      res.json({ ok: true, msg: '签到成功', id: result.lastInsertRowid });
    } catch (err) {
      console.error('签到失败:', err);
      res.status(500).json({ ok: false, msg: '签到失败，请重试' });
    }
  });

  // ========== 获取待签退车辆列表（已签到未签退） ==========
  router.get('/pending', (req, res) => {
    try {
      const rows = db.prepare(
        'SELECT id, name, plate, phone, company, checkin_time FROM records WHERE checkout_time IS NULL ORDER BY checkin_time DESC'
      ).all();
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
      const record = db.prepare('SELECT * FROM records WHERE id = ? AND checkout_time IS NULL').get(id);
      if (!record) {
        return res.status(404).json({ ok: false, msg: '未找到该签到记录或已签退' });
      }

      db.prepare("UPDATE records SET checkout_time = datetime('now', '+8 hours') WHERE id = ?").run(id);
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
      const rows = db.prepare(
        'SELECT id, name, plate, phone, company, checkin_time FROM records WHERE checkout_time IS NULL ORDER BY checkin_time DESC'
      ).all();
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

      const countRow = db.prepare(`SELECT COUNT(*) as total FROM records WHERE ${where}`).get(...params);
      const rows = db.prepare(
        `SELECT * FROM records WHERE ${where} ORDER BY checkin_time DESC LIMIT ? OFFSET ?`
      ).all(...params, parseInt(size), offset);

      res.json({
        ok: true,
        data: rows,
        total: countRow.total,
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
