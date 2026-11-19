FROM node:22-bookworm-slim

# Cài Python và công cụ tạo môi trường ảo
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 \
       python3-venv \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cài thư viện Node.js
COPY backend/package*.json ./backend/

RUN cd backend && npm ci --omit=dev

# Tạo môi trường Python tương thích với đường dẫn trong server.js
RUN python3 -m venv /app/.venv-tts \
    && /app/.venv-tts/bin/pip install --no-cache-dir \
       gTTS==2.5.4

# Sao chép mã nguồn backend
COPY backend/ ./backend/

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]