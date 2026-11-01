const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const path = require('path');

// ==========================================
// ĐỌC FILE .ENV TỪ THƯ MỤC GỐC DỰ ÁN
// ==========================================

require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

// ==========================================
// KHỞI TẠO EXPRESS
// ==========================================

const app = express();

app.use(cors());
app.use(express.json({ limit: '16kb' }));

// ==========================================
// CẤU HÌNH POSTGRESQL
// ==========================================

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',

  port: Number(process.env.DB_PORT) || 5432,

  user: process.env.DB_USER || 'vku_user',

  password:
    process.env.DB_PASSWORD ||
    process.env.POSTGRES_PASSWORD,

  database:
    process.env.DB_NAME ||
    'vku_student_support',

  connectionTimeoutMillis: 5000
});

// ==========================================
// API 1: KIỂM TRA TRẠNG THÁI BACKEND
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VKU AI Student Support Backend đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// API 2: GỬI CÂU HỎI ĐẾN N8N
// ==========================================

app.post('/api/ask', async (req, res) => {
  try {
    const question = req.body?.question;

    // Kiểm tra câu hỏi có hợp lệ không
    if (
      typeof question !== 'string' ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi hợp lệ.'
      });
    }

    // Giới hạn độ dài câu hỏi
    if (question.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được vượt quá 1000 ký tự.'
      });
    }

    // Địa chỉ Webhook của n8n
    const webhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      'http://localhost:5678/webhook/student-question';

    // Gửi câu hỏi đến n8n
    const response = await axios.post(
      webhookUrl,
      {
        question: question.trim()
      },
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Trả kết quả từ n8n về Frontend
    return res.json(response.data);

  } catch (error) {
    console.error(
      'Lỗi khi gọi n8n:',
      error.message
    );

    return res.status(502).json({
      success: false,
      message:
        'Không thể kết nối đến hệ thống xử lý câu hỏi. Vui lòng thử lại sau.'
    });
  }
});

// ==========================================
// API 3: LẤY DANH SÁCH FAQ
// ==========================================

app.get('/api/faqs', async (req, res) => {
  try {
    // Truy vấn danh sách FAQ từ PostgreSQL
    const result = await pool.query(`
      SELECT
        id,
        category,
        question,
        answer,
        keywords,
        source_type,
        source_url,
        verified,
        created_at,
        updated_at
      FROM faqs
      ORDER BY id ASC
    `);

    // Trả danh sách FAQ về Frontend
    return res.json({
      success: true,
      total: result.rows.length,
      faqs: result.rows
    });

  } catch (error) {
    console.error(
      'Lỗi truy vấn FAQ:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Không thể tải danh sách câu hỏi thường gặp.'
    });
  }
});

// ==========================================
// KHỞI ĐỘNG BACKEND
// ==========================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(
    `Backend đang chạy tại http://localhost:${PORT}`
  );
});