-- Bổ sung mã tra cứu bảo mật cho yêu cầu hỗ trợ sinh viên.
-- Chỉ lưu SHA-256 hash, không lưu mã tra cứu gốc.

BEGIN;

ALTER TABLE support_requests
ADD COLUMN IF NOT EXISTS lookup_token_hash VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS
support_requests_lookup_token_hash_idx
ON support_requests (lookup_token_hash)
WHERE lookup_token_hash IS NOT NULL;

COMMIT;
