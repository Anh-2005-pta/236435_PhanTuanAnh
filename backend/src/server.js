require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB, DEFAULT_DB_NAME } = require('./config/db');
const foodRoutes = require('./routes/foodRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  return res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'ok' : 'degraded',
    service: 'food-management-backend-236435',
    database: isConnected ? 'connected' : 'disconnected',
    dbName: mongoose.connection.name || process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Food Management RESTful API — 236435 Phan Tuan Anh',
    endpoints: {
      health: '/health',
      foods: '/api/foods',
      searchExample: '/api/foods?search=pho',
    },
  });
});

app.use('/api/foods', foodRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Không tìm thấy đường dẫn API: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Định dạng JSON gửi lên không hợp lệ.',
    });
  }

  if (err && err.code === 11000) {
    return res.status(409).json({
      message: 'Mã món ăn (foodId) đã tồn tại trong hệ thống.',
    });
  }

  if (err && err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((item) => item.message);
    return res.status(400).json({
      message: errors[0] || 'Dữ liệu món ăn không hợp lệ.',
      errors,
    });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({
      message: 'Định dạng tham số truy vấn không hợp lệ.',
    });
  }

  console.error('Unhandled API Error:', err);
  return res.status(500).json({
    message: 'Đã xảy ra lỗi máy chủ hoặc kết nối cơ sở dữ liệu.',
  });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend API listening on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas on startup:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
