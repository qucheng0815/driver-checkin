const express = require('express');
const QRCode = require('qrcode');
const router = express.Router();

router.get('/qrcode', async (req, res) => {
  const baseUrl = req.query.url || `${req.protocol}://${req.get('host')}`;
  try {
    const qrBuffer = await QRCode.toBuffer(baseUrl, {
      width: 400, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    res.set('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (err) {
    res.status(500).json({ ok: false, msg: '二维码生成失败' });
  }
});

router.get('/qrpage', (req, res) => {
  const baseUrl = req.query.url || `${req.protocol}://${req.get('host')}`;
  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>签到系统 - 扫码入口</title>
<style>body{font-family:-apple-system,sans-serif;text-align:center;padding:40px 20px;background:#f5f7fa}
h1{font-size:24px;color:#333;margin-bottom:8px}p{color:#888;margin-bottom:30px}
img{border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.1)}.url{margin-top:20px;font-size:14px;color:#667eea;word-break:break-all}</style>
</head><body>
<h1>🚛 司机签到系统</h1>
<p>请使用微信或手机浏览器扫描二维码</p>
<img src="/api/qrcode?url=${encodeURIComponent(baseUrl)}" alt="签到二维码" width="280" height="280">
<div class="url">${baseUrl}</div>
</body></html>`);
});

module.exports = router;
