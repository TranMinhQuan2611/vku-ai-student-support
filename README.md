# VKU AI Student Support

## 1. Giới thiệu

VKU AI Student Support là hệ thống trợ lý AI hỗ trợ sinh viên
Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU).

Hệ thống được xây dựng nhằm giúp sinh viên tìm kiếm thông tin,
giải đáp thắc mắc và tiếp cận các dịch vụ hỗ trợ sinh viên
một cách nhanh chóng, thuận tiện.

## 2. Mục tiêu

- Xây dựng trợ lý AI hỗ trợ sinh viên VKU.
- Giải đáp các câu hỏi thường gặp bằng tiếng Việt.
- Cung cấp câu trả lời dưới dạng văn bản và giọng nói.
- Tích hợp n8n để tự động hóa quy trình xử lý câu hỏi.
- Quản lý dữ liệu FAQ bằng PostgreSQL.
- Hỗ trợ chuyển tiếp những câu hỏi chưa được giải đáp.
- Xây dựng giao diện hiện đại, trực quan và dễ sử dụng.
- Triển khai hệ thống để người dùng có thể truy cập qua Internet.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Workflow Automation | n8n |
| Containerization | Docker, Docker Compose |
| Version Control | Git, GitHub |
| Text-to-Speech | Web Speech API |
| Operating System | Ubuntu 24.04 LTS |

## 4. Chức năng dự kiến

### Dành cho sinh viên

- Đặt câu hỏi cho trợ lý AI.
- Nhận câu trả lời bằng tiếng Việt.
- Nghe câu trả lời bằng giọng nói.
- Xem các câu hỏi thường gặp.
- Tìm kiếm thông tin theo chủ đề.
- Gửi yêu cầu hỗ trợ khi chưa tìm được câu trả lời.

### Dành cho quản trị viên

- Quản lý danh sách câu hỏi thường gặp.
- Thêm, sửa và xóa dữ liệu FAQ.
- Quản lý yêu cầu hỗ trợ của sinh viên.
- Theo dõi lịch sử câu hỏi.
- Xem thống kê hoạt động của hệ thống.

## 5. Kiến trúc dự kiến

Frontend (React)
    |
    v
Backend API (Express)
    |
    +---- PostgreSQL
    |
    +---- n8n Workflow
              |
              v
          AI Processing

## 6. Trạng thái phát triển

Dự án đang trong quá trình xây dựng.

Các chức năng sẽ được triển khai và kiểm thử theo từng giai đoạn.

## 7. Môi trường phát triển

- Ubuntu 24.04 LTS (Dual Boot với Windows)
- Visual Studio Code
- Git
- Node.js
- Docker Engine
- Docker Compose

## 8. Ghi chú

Dự án được thực hiện phục vụ mục đích học tập và nghiên cứu.

Các thông tin liên quan đến quy định của VKU cần được
đối chiếu với nguồn chính thức trước khi cung cấp cho sinh viên.