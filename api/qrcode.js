const QRCode = require('qrcode');

module.exports = async function handler(req, res) {
  const baseUrl = req.query.url || `https://${req.headers.host}`;

  try {
    const qrBuffer = await QRCode.toBuffer(baseUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    res.setHeader('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (err) {
    console.error('二维码生成失败:', err);
    res.status(500).json({ ok: false, msg: '二维码生成失败' });
  }
};
