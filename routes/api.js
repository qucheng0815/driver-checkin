const express = require('express');
const router = express.Router();
const { loadData, saveData, getBeijingTime, getBeijingDate } = require('../db/init');

// 管理员密码
const ADMIN_PASSWORD = 'admin123';

module.exports = function () {

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

  // ========== 获取待签退车辆列表（已签到未签退） ==========
  router.get('/pending', (req, res) => {
    try {
      const data = loadData();
      const rows = data.records
        .filter(r => !r.checkout_time)
        .sort((a, b) => b.checkin_time.localeCompare(a.checkin_time));
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
      const data = loadData();
      const record = data.records.find(r => r.id === id && !r.checkout_time);
      if (!record) {
        return res.status(404).json({ ok: false, msg: '未找到该签到记录或已签退' });
      }

      record.checkout_time = getBeijingTime();
      saveData(data);
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
      const data = loadData();
      const rows = data.records
        .filter(r => !r.checkout_time)
        .sort((a, b) => b.checkin_time.localeCompare(a.checkin_time));
      res.json({ ok: true, data: rows });
    } catch (err) {
      console.error('查询在场车辆失败:', err);
      res.status(500).json({ ok: false, msg: '查询失败' });
    }
  });

  // ========== 管理后台 - 历史记录（按日期筛选） ==========
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

      // 按签到时间倒序
      filtered.sort((a, b) => b.checkin_time.localeCompare(a.checkin_time));

      const total = filtered.length;
      const offset = (pageNum - 1) * pageSize;
      const rows = filtered.slice(offset, offset + pageSize);

      res.json({
        ok: true,
        data: rows,
        total,
        page: pageNum,
        size: pageSize
      });
    } catch (err) {
      console.error('查询历史记录失败:', err);
      res.status(500).json({ ok: false, msg: '查询失败' });
    }
  });

  return router;
};
