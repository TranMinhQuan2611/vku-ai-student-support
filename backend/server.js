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
// VÀ TỰ ĐỘNG LƯU LỊCH SỬ
// ==========================================

app.post('/api/ask', async (req, res) => {
  try {
    const question = req.body?.question;

    // Kiểm tra câu hỏi hợp lệ
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
    const cleanQuestion = question.trim();

    if (cleanQuestion.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được vượt quá 1000 ký tự.'
      });
    }

    // Địa chỉ Webhook n8n
    const webhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      'http://localhost:5678/webhook/student-question';

    // Gửi câu hỏi đến n8n
    const response = await axios.post(
      webhookUrl,
      {
        question: cleanQuestion
      },
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Dữ liệu phản hồi từ n8n
    const aiResult = response.data;

    // Kiểm tra phản hồi hợp lệ
    if (
      !aiResult ||
      typeof aiResult !== 'object' ||
      Array.isArray(aiResult) ||
      aiResult.success === false ||
      typeof aiResult.answer !== 'string' ||
      !aiResult.answer.trim()
    ) {
      return res.status(502).json({
        success: false,
        message: 'Hệ thống AI trả về dữ liệu không hợp lệ.'
      });
    }

    // ======================================
    // LƯU LỊCH SỬ VÀO POSTGRESQL
    // ======================================

    try {
      const saveResult = await pool.query(
        `
        INSERT INTO chat_history (
          question,
          answer,
          matched,
          faq_id,
          category
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
        `,
        [
          cleanQuestion,
          aiResult.answer.trim(),
          aiResult.matched === true,
          Number.isInteger(Number(aiResult.faq_id)) &&
          aiResult.faq_id !== null &&
          aiResult.faq_id !== undefined &&
          aiResult.faq_id !== ''
            ? Number(aiResult.faq_id)
            : null,
          typeof aiResult.category === 'string'
            ? aiResult.category
            : null
        ]
      );

      // Trả kết quả AI kèm ID lịch sử
      return res.json({
        ...aiResult,
        history_id: saveResult.rows[0].id,
        history_created_at: saveResult.rows[0].created_at
      });

    } catch (dbError) {
      console.error(
        'Lỗi lưu lịch sử hội thoại:',
        dbError.message
      );

      // AI vẫn trả lời nếu PostgreSQL gặp lỗi.
      // Không báo đã lưu thành công.
      return res.json({
        ...aiResult,
        history_id: null,
        history_saved: false
      });
    }

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
// API 4: LẤY LỊCH SỬ HỘI THOẠI
// ==========================================

app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        question,
        answer,
        matched,
        faq_id,
        category,
        created_at
      FROM chat_history
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `);

    return res.json({
      success: true,
      total: result.rows.length,
      history: result.rows
    });

  } catch (error) {
    console.error(
      'Lỗi lấy lịch sử hội thoại:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Không thể tải lịch sử hội thoại.'
    });
  }
});

// ==========================================
// API 5: XÓA MỘT MỤC LỊCH SỬ
// ==========================================

app.delete('/api/history/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch sử không hợp lệ.'
      });
    }

    const result = await pool.query(
      `
      DELETE FROM chat_history
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử cần xóa.'
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa lịch sử thành công.',
      deleted_id: id
    });

  } catch (error) {
    console.error(
      'Lỗi xóa lịch sử:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa lịch sử hội thoại.'
    });
  }
});

// ==========================================
// API 6: XÓA TOÀN BỘ LỊCH SỬ
// ==========================================

app.delete('/api/history', async (req, res) => {
  try {
    const result = await pool.query(`
      DELETE FROM chat_history
    `);

    return res.json({
      success: true,
      message: 'Đã xóa toàn bộ lịch sử hội thoại.',
      deleted_count: result.rowCount
    });

  } catch (error) {
    console.error(
      'Lỗi xóa toàn bộ lịch sử:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa toàn bộ lịch sử.'
    });
  }
});

// ==========================================
// API 7: THÊM CÂU HỎI FAQ
// ==========================================

app.post('/api/faqs', async (req, res) => {
  try {
    const { category, question, answer } = req.body || {};

    // ======================================
    // KIỂM TRA DỮ LIỆU ĐẦU VÀO
    // ======================================

    if (
      typeof category !== 'string' ||
      typeof question !== 'string' ||
      typeof answer !== 'string' ||
      !category.trim() ||
      !question.trim() ||
      !answer.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Vui lòng nhập đầy đủ danh mục, câu hỏi và câu trả lời.'
      });
    }

    // ======================================
    // CHUẨN HÓA DỮ LIỆU
    // ======================================

    const cleanCategory = category.trim();
    const cleanQuestion = question.trim();
    const cleanAnswer = answer.trim();

    // ======================================
    // KIỂM TRA ĐỘ DÀI
    // ======================================

    if (cleanCategory.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          'Tên danh mục không được vượt quá 100 ký tự.'
      });
    }

    if (cleanQuestion.length > 1000) {
      return res.status(400).json({
        success: false,
        message:
          'Câu hỏi không được vượt quá 1000 ký tự.'
      });
    }

    if (cleanAnswer.length > 10000) {
      return res.status(400).json({
        success: false,
        message:
          'Câu trả lời không được vượt quá 10000 ký tự.'
      });
    }

    // ======================================
    // LƯU FAQ VÀO POSTGRESQL
    // ======================================

    const result = await pool.query(
      `
      INSERT INTO faqs (
        category,
        question,
        answer,
        keywords,
        source_type,
        verified
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
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
      `,
      [
        cleanCategory,
        cleanQuestion,
        cleanAnswer,
        [],
        'manual',
        false
      ]
    );

    // ======================================
    // TRẢ KẾT QUẢ THÀNH CÔNG
    // ======================================

    return res.status(201).json({
      success: true,
      message: 'Thêm câu hỏi FAQ thành công.',
      faq: result.rows[0]
    });

  } catch (error) {
    console.error(
      'Lỗi thêm FAQ:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Không thể thêm câu hỏi FAQ. Vui lòng thử lại.'
    });
  }
});

// ==========================================
// API 8: CẬP NHẬT CÂU HỎI FAQ
// ==========================================

app.put('/api/faqs/:id', async (req, res) => {
  try {
    // Lấy ID câu hỏi
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID câu hỏi FAQ không hợp lệ.'
      });
    }

    // Lấy dữ liệu từ frontend
    const {
      category,
      question,
      answer,
      source_url
    } = req.body || {};

    // Kiểm tra dữ liệu bắt buộc
    if (
      typeof category !== 'string' ||
      !category.trim() ||
      typeof question !== 'string' ||
      !question.trim() ||
      typeof answer !== 'string' ||
      !answer.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ danh mục, câu hỏi và câu trả lời.'
      });
    }

    // Kiểm tra nguồn tham khảo
    if (
      source_url !== undefined &&
      source_url !== null &&
      typeof source_url !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nguồn tham khảo không hợp lệ.'
      });
    }

    const cleanCategory = category.trim();
    const cleanQuestion = question.trim();
    const cleanAnswer = answer.trim();
    const cleanSourceUrl =
      typeof source_url === 'string'
        ? source_url.trim() || null
        : null;

    // Cập nhật dữ liệu PostgreSQL
    const result = await pool.query(
      `
      UPDATE faqs
      SET
        category = $1,
        question = $2,
        answer = $3,
        source_url = $4,
        verified = false,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
      `,
      [
        cleanCategory,
        cleanQuestion,
        cleanAnswer,
        cleanSourceUrl,
        id
      ]
    );

    // Không tìm thấy câu hỏi
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi FAQ cần sửa.'
      });
    }

    // Trả kết quả thành công
    return res.json({
      success: true,
      message: 'Cập nhật câu hỏi FAQ thành công.',
      faq: result.rows[0]
    });

  } catch (error) {
    console.error(
      'Lỗi cập nhật FAQ:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật câu hỏi FAQ. Vui lòng thử lại.'
    });
  }
});
// ==========================================
// API: XÓA CÂU HỎI FAQ
// ==========================================

app.delete('/api/faqs/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Kiểm tra ID
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID câu hỏi FAQ không hợp lệ.'
      });
    }

    // Xóa FAQ khỏi PostgreSQL
    const result = await pool.query(
      `
      DELETE FROM faqs
      WHERE id = $1
      RETURNING id, question
      `,
      [id]
    );

    // Không tìm thấy FAQ
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi FAQ cần xóa.'
      });
    }

    // Xóa thành công
    return res.json({
      success: true,
      message: 'Đã xóa câu hỏi FAQ thành công.',
      deleted_faq: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi xóa FAQ:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa câu hỏi FAQ.'
    });
  }
});
// ==========================================
// API 10: XÁC MINH / HỦY XÁC MINH FAQ
// ==========================================

app.patch('/api/faqs/:id/verify', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { verified } = req.body || {};

    // Kiểm tra ID
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID câu hỏi FAQ không hợp lệ.'
      });
    }

    // Kiểm tra trạng thái xác minh
    if (typeof verified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái xác minh phải là true hoặc false.'
      });
    }

    // Cập nhật trạng thái trong PostgreSQL
    const result = await pool.query(
      `
        UPDATE faqs
        SET
          verified = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [verified, id]
    );

    // Không tìm thấy câu hỏi
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi FAQ.'
      });
    }

    // Trả kết quả
    return res.json({
      success: true,
      message: verified
        ? 'Xác minh câu hỏi FAQ thành công.'
        : 'Đã hủy xác minh câu hỏi FAQ.',
      faq: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi xác minh FAQ:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái xác minh FAQ.'
    });
  }
});
// ==========================================
// API GOOGLE TEXT TO SPEECH
// ==========================================

app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;

    // Kiểm tra nội dung
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp văn bản cần đọc.'
      });
    }

    // Giới hạn độ dài văn bản
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Văn bản không được vượt quá 1000 ký tự.'
      });
    }

    const { spawn } = require('child_process');

    const pythonPath = path.join(__dirname, '../.venv-tts/bin/python');
    const scriptPath = path.join(__dirname, 'google_tts_service.py');

    const python = spawn(pythonPath, [
      scriptPath,
      text,
      '-'
    ]);

    const audioChunks = [];
    let errorOutput = '';

    python.stdout.on('data', (chunk) => {
      audioChunks.push(chunk);
    });

    python.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    python.on('error', (error) => {
      console.error('Không thể chạy Python TTS:', error.message);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Không thể khởi động dịch vụ giọng nói.'
        });
      }
    });

    python.on('close', (code) => {
      if (res.headersSent) return;

      if (code !== 0) {
        console.error('Google TTS lỗi:', errorOutput);

        return res.status(500).json({
          success: false,
          message: 'Không thể tạo giọng nói.'
        });
      }

      const audioBuffer = Buffer.concat(audioChunks);

      if (audioBuffer.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'Không nhận được dữ liệu âm thanh.'
        });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-store');

      return res.send(audioBuffer);
    });

  } catch (error) {
    console.error('Lỗi API TTS:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo giọng nói.'
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
