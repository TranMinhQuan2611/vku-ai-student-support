const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');
const path = require('path');
const crypto = require('node:crypto');
const { spawn } = require('child_process');

const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');

// ==========================================
// ĐỌC BIẾN MÔI TRƯỜNG
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
// KẾT NỐI POSTGRESQL
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
// CẤU HÌNH SESSION ADMIN
// ==========================================

const isProduction = process.env.NODE_ENV === 'production';

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 64
) {
  throw new Error(
    'SESSION_SECRET phải được cấu hình và có ít nhất 64 ký tự.'
  );
}

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: false
    }),

    name: 'vku_admin_sid',
    secret: process.env.SESSION_SECRET,

    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);

// ==========================================
// MIDDLEWARE KIỂM TRA QUYỀN ADMIN
// ==========================================

function requireAdmin(req, res, next) {
  if (
    !req.session?.admin?.id ||
    req.session.admin.role !== 'admin'
  ) {
    return res.status(401).json({
      success: false,
      message: 'Bạn cần đăng nhập Admin.'
    });
  }

  next();
}

// ==========================================
// API ĐĂNG NHẬP ADMIN
// ==========================================

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập và mật khẩu.'
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        username,
        password_hash,
        role,
        is_active
      FROM admin_users
      WHERE username = $1
      LIMIT 1
      `,
      [username.trim()]
    );

    const admin = result.rows[0];

    if (
      !admin ||
      !admin.is_active ||
      admin.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác.'
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error('Lỗi tạo session:', error.message);

        return res.status(500).json({
          success: false,
          message: 'Không thể tạo phiên đăng nhập.'
        });
      }

      req.session.admin = {
        id: admin.id,
        username: admin.username,
        role: admin.role
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error(
            'Lỗi lưu session:',
            saveError.message
          );

          return res.status(500).json({
            success: false,
            message: 'Không thể lưu phiên đăng nhập.'
          });
        }

        return res.json({
          success: true,
          message: 'Đăng nhập Admin thành công.',
          admin: req.session.admin
        });
      });
    });

  } catch (error) {
    console.error(
      'Lỗi đăng nhập Admin:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Không thể đăng nhập. Vui lòng thử lại.'
    });
  }
});

// ==========================================
// API KIỂM TRA PHIÊN ĐĂNG NHẬP
// ==========================================

app.get('/api/admin/me', requireAdmin, (req, res) => {
  return res.json({
    success: true,
    authenticated: true,
    admin: req.session.admin
  });
});

// ==========================================
// API ĐĂNG XUẤT ADMIN
// ==========================================

app.post('/api/admin/logout', (req, res) => {
  if (!req.session) {
    return res.json({
      success: true,
      message: 'Đã đăng xuất.'
    });
  }

  req.session.destroy((error) => {
    if (error) {
      console.error('Lỗi đăng xuất:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Không thể đăng xuất.'
      });
    }

    res.clearCookie('vku_admin_sid', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Đăng xuất thành công.'
    });
  });
});

// ==========================================
// API 1: KIỂM TRA BACKEND
// ==========================================

app.get('/api/health', (req, res) => {
  return res.json({
    success: true,
    message: 'VKU AI Student Support Backend đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// API 2: GỬI CÂU HỎI ĐẾN N8N
// VÀ LƯU LỊCH SỬ
// ==========================================

app.post('/api/ask', async (req, res) => {
  try {
    const question = req.body?.question;

    if (
      typeof question !== 'string' ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi hợp lệ.'
      });
    }

    const cleanQuestion = question.trim();

    if (cleanQuestion.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi không được vượt quá 1000 ký tự.'
      });
    }

    const webhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      'http://localhost:5678/webhook/student-question';

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

    const aiResult = response.data;

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
// CHỈ ADMIN
// ==========================================

app.post('/api/faqs', requireAdmin, async (req, res) => {
  try {
    const { category, question, answer } = req.body || {};

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

    const cleanCategory = category.trim();
    const cleanQuestion = question.trim();
    const cleanAnswer = answer.trim();

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
// CHỈ ADMIN
// ==========================================

app.put('/api/faqs/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID câu hỏi FAQ không hợp lệ.'
      });
    }

    const {
      category,
      question,
      answer,
      source_url
    } = req.body || {};

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
        message:
          'Vui lòng nhập đầy đủ danh mục, câu hỏi và câu trả lời.'
      });
    }

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

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi FAQ cần sửa.'
      });
    }

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
      message:
        'Không thể cập nhật câu hỏi FAQ. Vui lòng thử lại.'
    });
  }
});

// ==========================================
// API 9: XÓA CÂU HỎI FAQ
// CHỈ ADMIN
// ==========================================

app.delete('/api/faqs/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID câu hỏi FAQ không hợp lệ.'
      });
    }

    const result = await pool.query(
      `
      DELETE FROM faqs
      WHERE id = $1
      RETURNING id, question
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi FAQ cần xóa.'
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa câu hỏi FAQ thành công.',
      deleted_faq: result.rows[0]
    });

  } catch (error) {
    console.error(
      'Lỗi xóa FAQ:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa câu hỏi FAQ.'
    });
  }
});

// ==========================================
// API 10: XÁC MINH / HỦY XÁC MINH FAQ
// CHỈ ADMIN
// ==========================================

app.patch(
  '/api/faqs/:id/verify',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { verified } = req.body || {};

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID câu hỏi FAQ không hợp lệ.'
        });
      }

      if (typeof verified !== 'boolean') {
        return res.status(400).json({
          success: false,
          message:
            'Trạng thái xác minh phải là true hoặc false.'
        });
      }

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

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy câu hỏi FAQ.'
        });
      }

      return res.json({
        success: true,
        message: verified
          ? 'Xác minh câu hỏi FAQ thành công.'
          : 'Đã hủy xác minh câu hỏi FAQ.',
        faq: result.rows[0]
      });

    } catch (error) {
      console.error(
        'Lỗi xác minh FAQ:',
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          'Không thể cập nhật trạng thái xác minh FAQ.'
      });
    }
  }
);

// ==========================================
// API 11: GOOGLE TEXT TO SPEECH
// ==========================================

app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body || {};

    if (
      typeof text !== 'string' ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp văn bản cần đọc.'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        message:
          'Văn bản không được vượt quá 1000 ký tự.'
      });
    }

    const pythonPath = path.join(
      __dirname,
      '../.venv-tts/bin/python'
    );

    const scriptPath = path.join(
      __dirname,
      'google_tts_service.py'
    );

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
      console.error(
        'Không thể chạy Python TTS:',
        error.message
      );

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message:
            'Không thể khởi động dịch vụ giọng nói.'
        });
      }
    });

    python.on('close', (code) => {
      if (res.headersSent) return;

      if (code !== 0) {
        console.error(
          'Google TTS lỗi:',
          errorOutput
        );

        return res.status(500).json({
          success: false,
          message: 'Không thể tạo giọng nói.'
        });
      }

      const audioBuffer = Buffer.concat(audioChunks);

      if (audioBuffer.length === 0) {
        return res.status(500).json({
          success: false,
          message:
            'Không nhận được dữ liệu âm thanh.'
        });
      }

      res.setHeader(
        'Content-Type',
        'audio/mpeg'
      );

      res.setHeader(
        'Cache-Control',
        'no-store'
      );

      return res.send(audioBuffer);
    });

  } catch (error) {
    console.error(
      'Lỗi API TTS:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Đã xảy ra lỗi khi tạo giọng nói.'
    });
  }
});
// ==========================================
// SUPPORT REQUESTS - PHÂN LOẠI YÊU CẦU
// ==========================================

const SUPPORT_DEPARTMENTS = {
  'Học phí': 'Phòng Kế hoạch - Tài chính',
  'Đăng ký học phần': 'Phòng Đào tạo',
  'Lịch thi': 'Phòng Đào tạo',
  'Ký túc xá': 'Phòng Công tác Sinh viên',
  'Học bổng': 'Phòng Công tác Sinh viên',
  'Tài khoản sinh viên': 'Bộ phận Công nghệ Thông tin',
  'Khác': 'Phòng Công tác Sinh viên'
};

const SUPPORT_STATUSES = [
  'pending',
  'in_progress',
  'resolved',
  'rejected'
];

const SUPPORT_PRIORITIES = [
  'low',
  'normal',
  'high',
  'urgent'
];

function cleanSupportText(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength + 1);
}

// ==========================================
// API: SINH VIÊN GỬI YÊU CẦU HỖ TRỢ
// POST /api/support-requests
// ==========================================

app.post('/api/support-requests', async (req, res) => {
  try {
    const studentName = cleanSupportText(
      req.body?.student_name,
      150
    );

    const studentEmail = cleanSupportText(
      req.body?.student_email,
      255
    );

    const subject = cleanSupportText(
      req.body?.subject,
      255
    );

    const description = cleanSupportText(
      req.body?.description,
      5000
    );

    const category = cleanSupportText(
      req.body?.category || 'Khác',
      100
    );

    if (
      !studentName ||
      !studentEmail ||
      !subject ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin bắt buộc.'
      });
    }

    if (
      studentName.length > 150 ||
      studentEmail.length > 255 ||
      subject.length > 255 ||
      description.length > 5000 ||
      category.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Một hoặc nhiều trường vượt quá độ dài cho phép.'
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(studentEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email không đúng định dạng.'
      });
    }

    if (!Object.hasOwn(SUPPORT_DEPARTMENTS, category)) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục yêu cầu không hợp lệ.'
      });
    }

    const assignedDepartment = SUPPORT_DEPARTMENTS[category];
// Tạo mã tra cứu ngẫu nhiên gồm 32 byte (256 bit).
const lookupToken = crypto.randomBytes(32).toString('hex');

// Chỉ lưu giá trị băm SHA-256 vào PostgreSQL.
const lookupTokenHash = crypto
  .createHash('sha256')
  .update(lookupToken)
  .digest('hex');
    const result = await pool.query(
  `
    INSERT INTO support_requests (
      student_name,
      student_email,
      subject,
      description,
      category,
      assigned_department,
      lookup_token_hash
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      subject,
      category,
      assigned_department,
      status,
      priority,
      created_at
  `,
  [
    studentName,
    studentEmail,
    subject,
    description,
    category,
    assignedDepartment,
    lookupTokenHash
  ]
);

    return res.status(201).json({
      success: true,
      message: 'Yêu cầu hỗ trợ đã được tiếp nhận.',
      request: {
        ...result.rows[0],
        lookup_token: lookupToken
      }
    });

  } catch (error) {
    console.error('Lỗi tạo yêu cầu hỗ trợ:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể tiếp nhận yêu cầu hỗ trợ.'
    });
  }
});

// ==========================================
// API: ADMIN XEM DANH SÁCH YÊU CẦU
// GET /api/admin/support-requests
// ==========================================

app.get(
  '/api/admin/support-requests',
  requireAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          SELECT
            id,
            student_name,
            student_email,
            subject,
            description,
            category,
            assigned_department,
            status,
            priority,
            admin_response,
            created_at,
            updated_at
          FROM support_requests
          ORDER BY created_at DESC, id DESC
          LIMIT 200
        `
      );

      return res.json({
        success: true,
        total: result.rows.length,
        requests: result.rows
      });

    } catch (error) {
      console.error('Lỗi lấy yêu cầu hỗ trợ:', error);

      return res.status(500).json({
        success: false,
        message: 'Không thể tải danh sách yêu cầu.'
      });
    }
  }
);

// ==========================================
// API: ADMIN CẬP NHẬT YÊU CẦU
// PATCH /api/admin/support-requests/:id
// ==========================================

app.patch(
  '/api/admin/support-requests/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID yêu cầu không hợp lệ.'
        });
      }

      const { status, priority, admin_response } = req.body || {};

      if (
        status === undefined &&
        priority === undefined &&
        admin_response === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'Không có dữ liệu cần cập nhật.'
        });
      }

      if (
        status !== undefined &&
        !SUPPORT_STATUSES.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ.'
        });
      }

      if (
        priority !== undefined &&
        !SUPPORT_PRIORITIES.includes(priority)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Mức ưu tiên không hợp lệ.'
        });
      }

      if (
        admin_response !== undefined &&
        (
          typeof admin_response !== 'string' ||
          admin_response.length > 5000
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung phản hồi không hợp lệ.'
        });
      }

      const result = await pool.query(
        `
          UPDATE support_requests
          SET
            status = COALESCE($1, status),
            priority = COALESCE($2, priority),
            admin_response = COALESCE($3, admin_response),
            updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `,
        [
          status ?? null,
          priority ?? null,
          admin_response === undefined
            ? null
            : admin_response.trim(),
          id
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy yêu cầu hỗ trợ.'
        });
      }

      return res.json({
        success: true,
        message: 'Đã cập nhật yêu cầu hỗ trợ.',
        request: result.rows[0]
      });

    } catch (error) {
      console.error('Lỗi cập nhật yêu cầu:', error);

      return res.status(500).json({
        success: false,
        message: 'Không thể cập nhật yêu cầu hỗ trợ.'
      });
    }
  }
);
// ==========================================
// KHỞI ĐỘNG BACKEND
// ==========================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(
    `Backend đang chạy tại http://localhost:${PORT}`
  );
});