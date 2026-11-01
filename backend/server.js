const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '16kb' }));

// API kiểm tra trạng thái backend
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'VKU AI Student Support Backend đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// API gửi câu hỏi đến n8n
app.post('/api/ask', async (req, res) => {
  try {
    const question = req.body?.question;

    // Kiểm tra dữ liệu đầu vào
    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi hợp lệ.'
      });
    }

    if (question.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được vượt quá 1000 ký tự.'
      });
    }

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

    // Trả kết quả từ n8n cho frontend
    return res.json(response.data);

  } catch (error) {
    console.error('Lỗi khi gọi n8n:', error.message);

    return res.status(502).json({
      success: false,
      message: 'Không thể kết nối đến hệ thống xử lý câu hỏi. Vui lòng thử lại sau.'
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend đang chạy tại http://localhost:${PORT}`);
});