const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
const apiRoutes = require('./routes/api')();
app.use('/api', apiRoutes);

// 二维码路由
const qrcodeRoutes = require('./routes/qrcode');
app.use('/api', qrcodeRoutes);

// 入口页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
  console.log(`签到系统已启动: http://localhost:${PORT}`);
  console.log(`管理后台: http://localhost:${PORT}/admin`);
});
