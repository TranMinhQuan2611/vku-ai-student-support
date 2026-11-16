const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');
const readline = require('readline');

require('dotenv').config({
  path: path.join(__dirname, '../../.env')
});

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'vku_user',
  password:
    process.env.DB_PASSWORD ||
    process.env.POSTGRES_PASSWORD,
  database:
    process.env.DB_NAME || 'vku_student_support'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

// Nhập thông tin thông thường
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Nhập mật khẩu không hiển thị ký tự
function askPassword(question) {
  return new Promise((resolve) => {
    const originalWrite = rl._writeToOutput;

    rl._writeToOutput = function (text) {
      if (text.includes('\n') || text.includes('\r')) {
        rl.output.write(text);
      }
    };

    rl.question(question, (password) => {
      rl._writeToOutput = originalWrite;
      rl.output.write('\n');
      resolve(password);
    });

    // Hiển thị lời nhắc
    rl.output.write(question);
  });
}

async function main() {
  try {
    console.log('\n=== TẠO TÀI KHOẢN ADMIN VKU ===\n');

    const username = (await ask('Tên đăng nhập: ')).trim();

    if (!/^[a-zA-Z0-9_]{3,100}$/.test(username)) {
      throw new Error(
        'Tên đăng nhập phải có 3-100 ký tự, chỉ gồm chữ, số hoặc dấu _.'
      );
    }

    const password = await askPassword('Mật khẩu: ');

    if (password.length < 12) {
      throw new Error('Mật khẩu phải có ít nhất 12 ký tự.');
    }

    const confirmPassword = await askPassword('Nhập lại mật khẩu: ');

    if (password !== confirmPassword) {
      throw new Error('Hai mật khẩu không khớp.');
    }

    // Mã hóa mật khẩu
    const passwordHash = await bcrypt.hash(password, 12);

    // Lưu tài khoản vào PostgreSQL
    const result = await pool.query(
      `
      INSERT INTO admin_users (
        username,
        password_hash,
        role,
        is_active
      )
      VALUES ($1, $2, 'admin', true)
      RETURNING id, username, role, is_active
      `,
      [username, passwordHash]
    );

    console.log('\nTạo tài khoản Admin thành công!');
    console.table(result.rows);

  } catch (error) {
    console.error('\nLỗi:', error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
