const express = require('express');
const router = express.Router();
const { loadData, saveData, getBeijingTime, getBeijingDate } = require('../db/init');

const ADMIN_PASSWORD = 'admin123';

module.exports = function () {

  router.post('/checkin', (req, res) => {
    const { name, plate, phone, company } = req.body;
    if (!name || !plate || !phone || !company) {
      return res.status(400).json({ ok: false, msg: '请填写完整信息' });
    }
    const allowed = ['中通', '月祥', '自有', '货拉拉'];
    if (!allowed.includes(company)) {
      return res.status(400).json({ ok: false, msg: '运输公司选择有误' });
    }
    try {
      const data = loadData();
      const record = {
        id: data.nextId++,
        name: name.trim(),
        plate: plate.trim().toUpperCase(),
        phone: phone.trim(),
        company,
        checkin_time: getBeijingTime(),
        checkout_time: null
      };
      data.records.push(record);
      saveData(data);
      res.json({ ok: true, msg: '签到成功', id: record.id });
    } catch (err) {
      console.error('签到失败:', err);
      res.status(500).json({ ok: false, msg: '签到失败，请重试' });
    }
  });

  router.get('/pending', (req, res) => {
    try {
      const data = loadData();
      const rows = data.records
        .filter(r => !r.checkout_time)
        .sort((a, b) => b.checkin_time.localeCompare(a.checkin_time));
      res.json({ ok: true, data: rows });
    } catch (err) {
      res.status(500).json({ ok: false, msg: '查询失败' });
    }
  });

  router.post('/checkout', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ ok: false, msg: '请选择要签退的记录' });
    try {
      const data = loadData();
      const record = data.records.find(r => r.id === id && !r.checkout_time);
      if (!record) return res.status(404).json({ ok: false, msg: '未找到该签到记录或已签退' });
      record.checkout_time = getBeijingTime();
      saveData(data);
      res.json({ ok: true, msg: '签退成功' });
    } catch (err) {
      res.status(500).json({ ok: false, msg: '签退失败，请重试' });
    }
  });

  router.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ ok: true, msg: '登录成功' });
    } else {
      res.status(401).json({ ok: false, msg: '密码错误' });
    }
  });

  router.get('/admin/current', (req, res) => {
    try {
      const data = loadData();
      const rows = data.records
        .filter(r => !r.checkout_time)
        .sort((a, b) => b.checkin_time.localeCompare(a.checkin_time));
      res.json({ ok: true, data: rows });
    } catch (err) {
      res.status(500).json({ ok: false, msg: '查询失败' });
    }
  });

  router.get('/admin/history', (req, res) => {
    const { date, page = 1, size = 50 } = req.query;
    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    try {
      const data = loadData();
      let filtered = data.records;
      if (date) {
        filtered = filtered.filter(r => getBeijingDate(r.checkin_time) === date);
      }
      filtered.sort((a, b) => b.checkin_time.localeCompare(a.checkin_time));
      const total = filtered.length;
      const offset = (pageNum - 1) * pageSize;
      const rows = filtered.slice(offset, offset + pageSize);
      res.json({ ok: true, data: rows, total, page: pageNum, size: pageSize });
    } catch (err) {
      res.status(500).json({ ok: false, msg: '查询失败' });
    }
  });

  return router;
};
